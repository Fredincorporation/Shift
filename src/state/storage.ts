/**
 * Storage adapter.
 *
 * The lesson that produced this file: saving must never depend on a single
 * backend. In the RUN host, appStorage writes to the platform's own cloud save.
 * In a sandboxed preview frame, browser storage (localStorage/sessionStorage) is
 * blocked outright — reading it throws "the document is sandboxed and lacks the
 * allow-same-origin flag" — and the SDK's local fallback cannot work either.
 *
 * So we probe every backend once at boot, keep the best one that actually works,
 * and always keep an in-memory copy so a session is never lost mid-play. Nothing
 * here ever throws.
 */
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

export type BackendId = 'host' | 'local' | 'session' | 'memory';

export interface Backend {
    id: BackendId;
    /** True when data survives a page refresh. */
    durable: boolean;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}

/* ------------------------------- backends -------------------------------- */

const hostBackend: Backend = {
    id: 'host',
    durable: true,
    async get(key) { return await RundotGameAPI.appStorage.getItem(key); },
    async set(key, value) { await RundotGameAPI.appStorage.setItem(key, value); },
    async remove(key) { await RundotGameAPI.appStorage.removeItem(key); },
};

/**
 * Touching window.localStorage THROWS in a sandboxed frame — the access itself
 * is the error, not the method call — so every use is wrapped.
 */
function webBackend(id: 'local' | 'session', pick: () => Storage): Backend {
    return {
        id,
        durable: true,
        async get(key) { return pick().getItem(key); },
        async set(key, value) { pick().setItem(key, value); },
        async remove(key) { pick().removeItem(key); },
    };
}

const memoryMap = new Map<string, string>();
const memoryBackend: Backend = {
    id: 'memory',
    durable: false,
    async get(key) { return memoryMap.has(key) ? memoryMap.get(key)! : null; },
    async set(key, value) { memoryMap.set(key, value); },
    async remove(key) { memoryMap.delete(key); },
};

/* -------------------------------- probing -------------------------------- */

const PROBE_KEY = 'shift_probe';

/** Write, read back, clean up. A backend only counts if it round-trips. */
async function works(backend: Backend): Promise<boolean> {
    const token = 'ok' + Date.now();
    try {
        await backend.set(PROBE_KEY, token);
        const back = await backend.get(PROBE_KEY);
        await backend.remove(PROBE_KEY);
        return back === token;
    } catch {
        return false;
    }
}

let active: Backend = memoryBackend;
let resolved = false;
/** Why the chosen backend was chosen — surfaced in the UI when it is not durable. */
let note = '';
/** True when the game is running inside the real RUN host (a published session). */
let inHost = false;

export function activeBackend(): Backend { return active; }
export function storageNote(): string { return note; }
/** True when progress will survive a refresh. */
export function isDurable(): boolean { return active.durable; }
/**
 * True only for a creator preview / local dev run — i.e. no RUN host answered.
 * Published players are never in this state, so preview wording must be gated
 * on it rather than on "storage failed".
 */
export function isPreviewEnvironment(): boolean { return !inHost; }

/**
 * Pick the best working backend. Called once during boot, before any load.
 */
export async function initStorage(hostReady: boolean): Promise<Backend> {
    if (resolved) return active;
    resolved = true;
    inHost = hostReady;

    const candidates: Backend[] = [];
    if (hostReady) candidates.push(hostBackend);
    // Guarded: merely reading window.localStorage can throw when sandboxed.
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            candidates.push(webBackend('local', () => window.localStorage));
        }
    } catch { /* sandboxed — not available */ }
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            candidates.push(webBackend('session', () => window.sessionStorage));
        }
    } catch { /* sandboxed — not available */ }

    for (const candidate of candidates) {
        if (await works(candidate)) {
            active = candidate;
            note = candidate.durable ? '' : 'This session only';
            return active;
        }
    }

    active = memoryBackend;
    note = hostReady
        // Inside the host and still nothing works: a genuine fault. Never call
        // this "preview" — a real player would have no idea what that means.
        ? 'Your progress could not be stored just now. Reopening the game usually fixes it.'
        : 'The preview window cannot store data, so progress lasts until you refresh. '
        + 'The published game saves normally.';
    return active;
}

/* ------------------------------ the API ---------------------------------- */
/** All of these swallow nothing: they return outcomes instead of throwing. */

export async function readKey(key: string): Promise<{ ok: boolean; value: string | null; error?: string }> {
    // The in-memory mirror answers first if the durable backend has no copy yet.
    try {
        const value = await active.get(key);
        if (value != null) return { ok: true, value };
    } catch (err) {
        const mirrored = memoryMap.get(key);
        if (mirrored != null) return { ok: true, value: mirrored };
        return { ok: false, value: null, error: describe(err) };
    }
    const mirrored = memoryMap.get(key);
    return { ok: true, value: mirrored != null ? mirrored : null };
}

export async function writeKey(key: string, value: string): Promise<{ ok: boolean; error?: string }> {
    // Always mirror in memory so the current session is safe regardless.
    memoryMap.set(key, value);
    if (active.id === 'memory') return { ok: true };
    try {
        await active.set(key, value);
        const back = await active.get(key);
        if (back !== value) return { ok: false, error: 'write did not persist' };
        return { ok: true };
    } catch (err) {
        return { ok: false, error: describe(err) };
    }
}

export async function removeKey(key: string): Promise<void> {
    memoryMap.delete(key);
    try { await active.remove(key); } catch { /* nothing to remove */ }
}

export function describe(err: unknown): string {
    if (err instanceof Error) return err.message.slice(0, 160);
    if (typeof err === 'string') return err.slice(0, 160);
    try { return JSON.stringify(err).slice(0, 160); } catch { return 'unknown error'; }
}
