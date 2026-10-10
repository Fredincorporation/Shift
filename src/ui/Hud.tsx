/**
 * Hud.tsx - Main HUD overlay containing top info bar, objective navigation bar,
 * help modal, in-game menu drawer, and episode recap trigger.
 */
import { useState } from 'react';
import { store, useStore } from '../state/store.ts';
import { locationName, track, travelOptions } from '../story/runtime.ts';
import type { WorldHandle } from '../world/world.ts';
import Controls from './Controls.tsx';
import MiniMap from './MiniMap.tsx';
import WorldLabels from './WorldLabels.tsx';

interface HudProps {
    world: WorldHandle | null;
    worldRef: React.MutableRefObject<WorldHandle | null>;
    nearest: string | null;
    nearestLabel: string | null;
    runInteraction: (id: string) => void;
    handleStick: (x: number, y: number) => void;
    goal: { title: string; hint: string } | null;
    keyInteractionTarget: { id: string } | null;
    keyElsewhere: boolean;
    followObjective: () => void;
}

export default function Hud({
    world,
    worldRef,
    nearest,
    nearestLabel,
    runInteraction,
    handleStick,
    goal,
    keyInteractionTarget,
    keyElsewhere,
    followObjective,
}: HudProps) {
    const [showHelp, setShowHelp] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const game = useStore((s) => s.game);
    const dialogue = useStore((s) => s.dialogue);
    const phoneOpen = useStore((s) => s.phoneOpen);
    const travelOpen = useStore((s) => s.travelOpen);
    const episodeEndOpen = useStore((s) => s.episodeEndOpen);
    const sleeping = useStore((s) => s.sleeping);
    const overlayUp = !!dialogue || phoneOpen || travelOpen || episodeEndOpen || sleeping;
    const travelCount = travelOptions(game).length;

    return (
        <>
            <div className="hud-top">
                <button
                    type="button"
                    className="hud-chip travel-chip"
                    onClick={() => {
                        store.patch({ travelOpen: true });
                        track('travel_opened', { beat: game.beat });
                    }}
                >
                    <span className="hud-day">{game.dayLabel}</span>
                    <span className="hud-place">{locationName(game.scene)}</span>
                    <span className="hud-travel">Travel{travelCount > 1 ? ` · ${travelCount}` : ''} &rsaquo;</span>
                </button>
                <div className="hud-right">
                    <button
                        type="button"
                        className="hud-icon"
                        onClick={() => {
                            setShowHelp((v) => !v);
                            track('help_toggled');
                        }}
                        aria-label="How to play"
                    >
                        ?
                    </button>
                    <button
                        type="button"
                        className={`hud-icon ${showMenu ? 'active' : ''}`}
                        onClick={() => {
                            setShowMenu((v) => !v);
                            track('hud_menu_pressed');
                        }}
                        aria-label="Menu"
                    >
                        &#9776;
                    </button>
                </div>
            </div>
            {goal && !overlayUp && (
                <div className="objective-bar">
                    <div className="objective-text">
                        <span className="objective-label">Next</span>
                        <span className="objective-title">{goal.title}</span>
                        <span className="objective-hint">{goal.hint}</span>
                    </div>
                    {keyInteractionTarget && (
                        <button type="button" className="objective-go" onClick={followObjective}>
                            {keyElsewhere ? 'Travel' : 'Go'}
                        </button>
                    )}
                </div>
            )}

            <WorldLabels
                world={world}
                onPick={(id) => {
                    track('world_label_tapped', { target: id, beat: game.beat });
                    worldRef.current?.goTo(id);
                }}
            />

            {!overlayUp && (
                <>
                    <MiniMap
                        world={world}
                        onPick={(id) => {
                            track('minimap_pin_tapped', { target: id, beat: game.beat });
                            worldRef.current?.goTo(id);
                        }}
                    />
                    <Controls
                        onStick={handleStick}
                        actionLabel={nearestLabel}
                        onAction={() => {
                            if (!nearest) return;
                            track('action_button_pressed', { target: nearest, beat: game.beat });
                            runInteraction(nearest);
                        }}
                    />
                </>
            )}

            {showHelp && (
                <div className="help-layer" onClick={() => setShowHelp(false)}>
                    <div className="help-card modern-help-card" onClick={(e) => e.stopPropagation()}>
                        <div className="help-card-header">
                            <span className="help-badge">HOW TO PLAY</span>
                            <h3 className="help-main-title">Shift: Dual Spheres</h3>
                            <p className="help-sub-quote">&ldquo;Everything you do here costs something somewhere else.&rdquo;</p>
                        </div>

                        <div className="help-grid">
                            <div className="help-item">
                                <span className="help-item-icon">🕹️</span>
                                <div className="help-item-content">
                                    <strong className="help-item-title">Movement &amp; Exploration</strong>
                                    <p className="help-item-desc">Drag the thumbstick on the right, or use <b>WASD / Arrow keys</b> to explore each diorama.</p>
                                </div>
                            </div>

                            <div className="help-item">
                                <span className="help-item-icon">💬</span>
                                <div className="help-item-content">
                                    <strong className="help-item-title">People &amp; Interactive Props</strong>
                                    <p className="help-item-desc">Tap any glowing label, colleague, or secret prop to walk over and begin dialogue.</p>
                                </div>
                            </div>

                            <div className="help-item">
                                <span className="help-item-icon">⚡</span>
                                <div className="help-item-content">
                                    <strong className="help-item-title">Contextual Action</strong>
                                    <p className="help-item-desc">When you stand within reach, the action button pulses above the thumbstick.</p>
                                </div>
                            </div>

                            <div className="help-item">
                                <span className="help-item-icon">📱</span>
                                <div className="help-item-content">
                                    <strong className="help-item-title">Smartphone &amp; MP3 Player</strong>
                                    <p className="help-item-desc">Tap the phone icon to answer messages, track vitals, review journals, and stream music.</p>
                                </div>
                            </div>

                            <div className="help-item">
                                <span className="help-item-icon">📍</span>
                                <div className="help-item-content">
                                    <strong className="help-item-title">City Travel</strong>
                                    <p className="help-item-desc">Tap the top-left location badge to travel between Northlight, home, the bar, and hospital.</p>
                                </div>
                            </div>

                            <div className="help-item">
                                <span className="help-item-icon">🎯</span>
                                <div className="help-item-content">
                                    <strong className="help-item-title">Story Objectives</strong>
                                    <p className="help-item-desc">Follow the top banner and press <b>Go</b> to guide your character to the next narrative beat.</p>
                                </div>
                            </div>
                        </div>

                        <div className="help-footer-credits">
                            <span>Soundtrack &bull; <a href="https://incompetech.com" target="_blank" rel="noreferrer">Music By: Incompetech.com</a></span>
                        </div>

                        <button type="button" className="help-close-btn" onClick={() => setShowHelp(false)}>
                            Understood &bull; Continue Shift
                        </button>
                    </div>
                </div>
            )}
            {showMenu && (
                <div className="burger-menu-layer" onClick={() => setShowMenu(false)}>
                    <div className="burger-menu-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="burger-menu-header">
                            <span className="burger-menu-logo">SHIFT</span>
                            <button type="button" className="burger-close-btn" onClick={() => setShowMenu(false)}>✕</button>
                        </div>
                        <div className="burger-menu-actions">
                            <button
                                type="button"
                                className="burger-item-btn"
                                onClick={() => { setShowMenu(false); setShowHelp(true); }}
                            >
                                <span className="burger-icon">❓</span>
                                <span>How To Play</span>
                            </button>
                            <button
                                type="button"
                                className="burger-item-btn"
                                onClick={() => { setShowMenu(false); store.patch({ phoneOpen: true }); }}
                            >
                                <span className="burger-icon">📱</span>
                                <span>Open Phone &amp; MP3 Player</span>
                            </button>
                            <button
                                type="button"
                                className="burger-item-btn"
                                onClick={() => { setShowMenu(false); store.patch({ travelOpen: true }); }}
                            >
                                <span className="burger-icon">📍</span>
                                <span>Travel Locations</span>
                            </button>
                            <button
                                type="button"
                                className="burger-item-btn danger"
                                onClick={() => { setShowMenu(false); store.patch({ phase: 'menu' }); }}
                            >
                                <span className="burger-icon">🏠</span>
                                <span>Title Menu</span>
                            </button>
                        </div>
                        <div className="burger-menu-credits">
                            <p className="credit-line">
                                🎵 <b>Music By: Incompetech.com</b>
                            </p>
                            <p className="credit-sub">Royalty-Free Music by Kevin MacLeod &bull; Creative Commons By Attribution</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
