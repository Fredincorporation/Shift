/**
 * Save migration. This is the contract that lets new episodes ship WITHOUT
 * wiping anybody's progress.
 *
 * Rules for every future episode:
 *   1. Never rename or reuse an existing beat/node id. Add new ones.
 *   2. Never remove a field from GameState. Add new fields with a default in
 *      freshState(), and they fill in automatically for old saves.
 *   3. If a story id really must change, add a line to MIGRATIONS below that
 *      maps the old id to the new one. Old saves are repaired, not discarded.
 *   4. Bump SAVE_VERSION when you add a migration step.
 *
 * A save is only ever thrown away if it is genuinely unreadable (corrupt JSON).
 * Anything else is repaired as faithfully as possible.
 */
import type { GameState } from './gameState.ts';

/** Bump this whenever a migration step is added below. */
export const SAVE_VERSION = 2;

/** Old beat ids that were renamed, mapped to their current names. */
const BEAT_RENAMES: Record<string, string> = {
    // Example for future use:
    // 'act4_thursday_old': 'act4_thursday',
};

/** Old node ids that were renamed, mapped to their current names. */
const NODE_RENAMES: Record<string, string> = {
    // The Tuesday-morning scene was split so Jonah appears at the studio.
    home_sleep_tuesday: 'tuesday_morning',
};

/** Old location ids that were renamed. */
const SCENE_RENAMES: Record<string, string> = {
    apartment: 'home',
    office: 'studio',
};

/**
 * Every beat that has ever existed, with the beat a player should be placed at
 * if their saved beat is no longer recognised. This is the safety net that stops
 * an unknown beat from stranding someone with nothing to click.
 */
export const BEAT_FALLBACKS: Record<string, string> = {
    act1_arrival: 'act1_arrival',
    act1_mara: 'act1_mara',
    act2_home: 'act2_home',
    act2_call: 'act2_call',
    act2_choice: 'act2_choice',
    act3_collision: 'act3_collision',
    act3_verdict: 'act3_verdict',
    act4_thursday: 'act4_thursday',
    act4_friday: 'act4_friday',
    act4_sunday: 'act4_sunday',
    epilogue: 'epilogue',
    ep2_return: 'ep2_return',
    ep2_crunch: 'ep2_crunch',
    ep2_break: 'ep2_break',
    ep2_clinic: 'ep2_clinic',
    ep2_slice: 'ep2_slice',
    ep2_epilogue: 'ep2_epilogue',
    ep3_lead: 'ep3_lead',
    ep3_people: 'ep3_people',
    ep3_ward: 'ep3_ward',
    ep3_reckoning: 'ep3_reckoning',
    ep3_epilogue: 'ep3_epilogue',
    ep4_monday: 'ep4_monday',
    ep4_producer: 'ep4_producer',
    ep4_standoff: 'ep4_standoff',
    ep4_epilogue: 'ep4_epilogue',
    ep5_blackout: 'ep5_blackout',
    ep5_leak: 'ep5_leak',
    ep5_reckoning: 'ep5_reckoning',
    ep5_epilogue: 'ep5_epilogue',
    ep6_gold: 'ep6_gold',
    ep6_cert: 'ep6_cert',
    ep6_launch_night: 'ep6_launch_night',
    ep6_epilogue: 'ep6_epilogue',
    ep7_aftermath: 'ep7_aftermath',
    ep7_reckoning: 'ep7_reckoning',
    ep7_future: 'ep7_future',
    ep7_epilogue: 'ep7_epilogue',
};

export interface MigrationResult {
    state: Partial<GameState>;
    /** True when anything was repaired — worth a telemetry note. */
    changed: boolean;
    notes: string[];
}

/**
 * Bring a saved blob up to the current shape. Takes the raw parsed object so it
 * can cope with saves written by any earlier version of the game.
 */
export function migrateSave(raw: Record<string, unknown>): MigrationResult {
    const state = { ...raw } as Partial<GameState> & { version?: number };
    const notes: string[] = [];
    let changed = false;
    const from = typeof state.version === 'number' ? state.version : 1;

    // --- v1 -> v2: episode ids, renamed scenes, unlocked-list introduced ---
    if (from < 2) {
        if (!Array.isArray(state.unlocked) || state.unlocked.length === 0) {
            // Pre-travel saves knew only the studio and the apartment.
            state.unlocked = ['studio', 'home'];
            notes.push('added travel list');
            changed = true;
        }
        changed = true;
    }

    // --- Renames, applied at every version ---
    if (typeof state.beat === 'string' && BEAT_RENAMES[state.beat]) {
        notes.push('beat ' + state.beat + ' renamed');
        state.beat = BEAT_RENAMES[state.beat];
        changed = true;
    }
    if (typeof state.node === 'string' && NODE_RENAMES[state.node]) {
        notes.push('node ' + state.node + ' renamed');
        state.node = NODE_RENAMES[state.node];
        changed = true;
    }
    if (typeof state.scene === 'string' && SCENE_RENAMES[state.scene]) {
        notes.push('scene ' + state.scene + ' renamed');
        state.scene = SCENE_RENAMES[state.scene] as GameState['scene'];
        changed = true;
    }
    if (Array.isArray(state.unlocked)) {
        const mapped = state.unlocked.map((id) =>
            typeof id === 'string' && SCENE_RENAMES[id] ? SCENE_RENAMES[id] : id
        ) as GameState['unlocked'];
        if (mapped.join('|') !== state.unlocked.join('|')) {
            state.unlocked = mapped;
            changed = true;
        }
    }

    state.version = SAVE_VERSION;
    return { state, changed, notes };
}
