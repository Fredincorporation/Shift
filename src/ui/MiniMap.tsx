/**
 * Minimap: a small top-down plan of the room you are in, with your position and
 * the live interaction points. Sits above the phone button on the right.
 */
import { useEffect, useRef, useState } from 'react';
import type { WorldHandle } from '../world/world.ts';
import { useStore } from '../state/store.ts';
import { activeInteractions } from '../story/runtime.ts';
import { ANCHORS, ROOM_BOUNDS } from '../world/anchors.ts';

interface Props {
    world: WorldHandle | null;
    onPick: (id: string) => void;
}

export default function MiniMap({ world, onPick }: Props) {
    const game = useStore((s) => s.game);
    const [open, setOpen] = useState(false);
    const dotRef = useRef<HTMLSpanElement | null>(null);

    // Close the map when the player changes location, so it never shows the plan
    // of a room they have just left.
    useEffect(() => { setOpen(false); }, [game.scene]);

    const bounds = ROOM_BOUNDS[game.scene];
    const interactions = activeInteractions(game).filter((i) => ANCHORS[i.id]?.scene === game.scene);

    // The player dot is written straight to the DOM so it never re-renders React.
    useEffect(() => {
        if (!world) return;
        let raf = 0;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            const dot = dotRef.current;
            if (!dot) return;
            const pos = world.getMapPosition();
            dot.style.left = pos.x * 100 + '%';
            dot.style.top = pos.z * 100 + '%';
        };
        loop();
        return () => cancelAnimationFrame(raf);
    }, [world, game.scene]);

    if (!world) return null;

    return (
        <div className={open ? 'minimap open' : 'minimap'}>
            <button
                type="button"
                className="minimap-toggle"
                onClick={() => setOpen((v) => !v)}
                aria-label="Room map"
            >
                <span className="minimap-glyph" />
            </button>

            {open && (
                <div className="minimap-plate">
                    <p className="minimap-title">Room map</p>
                    <div className="minimap-floor">
                        {interactions.map((interaction) => {
                            const entry = ANCHORS[interaction.id];
                            const x = (entry.anchor.at.x - bounds.minX) / (bounds.maxX - bounds.minX);
                            const z = (entry.anchor.at.z - bounds.minZ) / (bounds.maxZ - bounds.minZ);
                            return (
                                <button
                                    key={interaction.id}
                                    type="button"
                                    className={interaction.key ? 'minimap-pin key' : 'minimap-pin'}
                                    style={{ left: x * 100 + '%', top: z * 100 + '%' }}
                                    title={interaction.label}
                                    onClick={() => { onPick(interaction.id); setOpen(false); }}
                                />
                            );
                        })}
                        <span className="minimap-you" ref={dotRef} />
                    </div>
                    <p className="minimap-hint">Tap a marker to walk there</p>
                </div>
            )}
        </div>
    );
}
