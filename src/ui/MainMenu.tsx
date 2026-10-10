import { useState } from 'react';
import { store, useStore } from '../state/store.ts';
import { clearState, freshState, unblockSaves } from '../state/gameState.ts';
import { isPreviewEnvironment } from '../state/storage.ts';
import { persist, track } from '../story/runtime.ts';

/** Which episode a saved beat belongs to, for the Continue label. */
function episodeOf(beat: string): string {
    if (beat.startsWith('ep7_')) return 'Episode 7 (Finale)';
    if (beat.startsWith('ep6_')) return 'Episode 6';
    if (beat.startsWith('ep5_')) return 'Episode 5';
    if (beat.startsWith('ep4_')) return 'Episode 4';
    if (beat.startsWith('ep3_')) return 'Episode 3';
    if (beat.startsWith('ep2_')) return 'Episode 2';
    if (beat === 'epilogue') return 'Episode 1 — ending';
    return 'Episode 1';
}

export default function MainMenu() {
    const hasSave = useStore((s) => s.hasSave);
    const saveUnavailable = useStore((s) => s.saveUnavailable);
    const game = useStore((s) => s.game);
    const [confirmReset, setConfirmReset] = useState(false);
    // Preview-only wording is gated on this; published players never see it.
    const isPreview = isPreviewEnvironment();

    const start = (fresh: boolean) => {
        if (fresh) {
            const clean = freshState();
            void clearState();
            unblockSaves();
            store.patch({
                game: clean, dialogue: null, unread: 0, hasSave: true, walking: false,
                phoneOpen: false, travelOpen: false, episodeEndOpen: false, sleeping: false,
                saveUnavailable: false,
            });
            persist(clean);
        }
        track(fresh ? 'run_started_new' : 'run_continued', { beat: store.get().game.beat });
        store.patch({ phase: 'playing' });
    };

    /** Play without a save — nothing will be written, and we say so. */
    const playUnsaved = () => {
        track('run_started_unsaved');
        store.patch({ phase: 'playing' });
    };

    return (
        <main className="menu-screen">
            <div className="menu-vignette" />
            <div className="menu-content">
                <p className="menu-eyebrow">A story in episodes</p>
                <h1 className="menu-title">SHIFT</h1>
                <div className="menu-rule" />
                <p className="menu-copy">
                    Nine weeks to ship. A studio held together with tape. A family that keeps
                    a seat for you on Sunday. You cannot fully give yourself to both.
                </p>

                <div className="menu-actions">
                    {/* A returning player: continue where they left off. */}
                    {hasSave && (
                        <button type="button" className="btn-primary" onClick={() => start(false)}>
                            <span className="btn-line">Continue</span>
                            <span className="btn-sub">{episodeOf(game.beat)} &middot; {game.dayLabel}</span>
                        </button>
                    )}

                    {/* A new player. Storage is fine, they simply have no save. */}
                    {!hasSave && !saveUnavailable && (
                        <button type="button" className="btn-primary" onClick={() => start(true)}>
                            Begin Episode 1
                        </button>
                    )}

                    {/*
                      Storage is genuinely unreachable. Lead with playing, so the
                      game is never a dead end, and keep the explanation small
                      and underneath rather than shouting at them.
                    */}
                    {!hasSave && saveUnavailable && (
                        <button type="button" className="btn-primary" onClick={playUnsaved}>
                            <span className="btn-line">Begin Episode 1</span>
                            {isPreview && <span className="btn-sub">This session only in preview</span>}
                        </button>
                    )}

                    {hasSave && !confirmReset && (
                        <button type="button" className="btn-ghost" onClick={() => setConfirmReset(true)}>
                            Start over
                        </button>
                    )}
                    {hasSave && confirmReset && (
                        <div className="reset-confirm">
                            <p className="reset-warn">
                                This erases your run &mdash; every choice, meter and place.
                                New episodes never do this; only this button does.
                            </p>
                            <button type="button" className="btn-ghost danger" onClick={() => start(true)}>
                                Yes, erase and start Episode 1
                            </button>
                            <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                                Keep my progress
                            </button>
                        </div>
                    )}
                </div>

                {/*
                  Footnote about where progress is being kept. The preview
                  wording is only ever shown to a creator; a real player sees a
                  plain message, or nothing at all when saving is healthy.
                */}
                {saveUnavailable && isPreview && (
                    <p className="menu-note subtle-warn">
                        Progress is held for this session only &mdash; the preview window
                        cannot store data. The published game saves normally.
                    </p>
                )}
                {saveUnavailable && !isPreview && (
                    <p className="menu-note subtle-warn">
                        Your progress could not be reached just now. Reopening the game
                        usually fixes it.
                    </p>
                )}
                {!saveUnavailable && (
                    <p className="menu-note">
                        Your run is saved automatically and carries across new episodes.
                    </p>
                )}

                <div className="menu-music-credit-wrap">
                    <span className="menu-music-credit-text">
                        🎵 Music By: <a href="https://incompetech.com" target="_blank" rel="noreferrer">Incompetech.com</a>
                    </span>
                </div>
            </div>
        </main>
    );
}
