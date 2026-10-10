import React from 'react';
import { createRoot } from 'react-dom/client';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import App from './ui/App.tsx';
import { store } from './state/store.ts';
import { loadStateDetailed, publishStorageStatus } from './state/gameState.ts';
import { initStorage, isDurable, activeBackend } from './state/storage.ts';
import { flushPersist } from './story/runtime.ts';
import { initSdk, registerLifecycles, sdkReady } from './sdk/runSdk.ts';
import './styles/app.css';

async function boot() {
    // 1. SDK first — nothing may call RundotGameAPI before this resolves.
    const ready = await initSdk();

    // 2. Choose a storage backend that ACTUALLY works before touching a save.
    //    In the RUN host this is the platform's cloud save. In a sandboxed
    //    preview frame, browser storage throws on access, so we fall back to an
    //    in-session store and say so plainly rather than failing silently.
    await initStorage(ready);
    publishStorageStatus();

    // 3. Restore the run before the first paint so the menu shows real progress.
    const outcome = await loadStateDetailed();
    if (outcome.status === 'loaded') {
        store.patch({ game: outcome.state, hasSave: true });
    } else if (outcome.status === 'unavailable') {
        store.patch({ saveUnavailable: true });
    }
    // 'empty' falls through: a new player, no warning, fresh start.

    // Progress that cannot outlive a refresh is flagged for the UI.
    if (!isDurable()) store.patch({ saveUnavailable: true });

    createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const cover = document.getElementById('boot-cover');
            if (!cover) return;
            cover.classList.add('hidden');
            setTimeout(() => cover.remove(), 400);
        });
    });

    // 4. Short warm-up so the first frame of the diorama is ready.
    for (let i = 1; i <= 5; i++) {
        store.patch({ loadProgress: i / 5 });
        await new Promise((resolve) => setTimeout(resolve, 70));
    }
    try { await document.fonts.ready; } catch { /* older engines */ }
    store.patch({ phase: 'menu' });

    registerLifecycles({
        onPause: () => store.patch({ paused: true }),
        onResume: () => store.patch({ paused: false }),
        // Commit any batched write immediately — a backgrounded app may not get
        // another chance to save.
        onSleep: () => flushPersist(store.get().game),
        onQuit: () => flushPersist(store.get().game),
    });

    // Belt and braces for the web build: the browser can close without the host
    // lifecycle hooks firing at all.
    const flush = () => flushPersist(store.get().game);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
    });

    if (sdkReady()) {
        try {
            const game = store.get().game;
            RundotGameAPI.analytics.recordCustomEvent('game_loaded', {
                returning: store.get().hasSave,
                save_status: outcome.status,
                storage: activeBackend().id,
                durable: isDurable(),
                beat: game.beat,
                episode: game.beat.startsWith('ep2_') ? 2 : 1,
            });
        } catch (err) {
            console.warn('[Main] boot analytics failed', err);
        }
    }
}

if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot);
