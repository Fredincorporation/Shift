/**
 * World-space billboard labels above people and props.
 *
 * Two rules that matter:
 *  1. Only interactions in the room the player is ACTUALLY in get a label. A
 *     label from another location must never survive a change of scene.
 *  2. Positions are written straight to the DOM each frame rather than through
 *     React state, so taps always land on a stable element.
 */
import { useEffect, useRef } from 'react';
import type { WorldHandle } from '../world/world.ts';
import { useStore } from '../state/store.ts';
import { activeInteractions } from '../story/runtime.ts';
import type { Interaction } from '../story/story.ts';
import { ANCHORS } from '../world/anchors.ts';

interface Props {
    world: WorldHandle | null;
    onPick: (id: string) => void;
}

export default function WorldLabels({ world, onPick }: Props) {
    const game = useStore((s) => s.game);
    const dialogue = useStore((s) => s.dialogue);
    const phoneOpen = useStore((s) => s.phoneOpen);
    const travelOpen = useStore((s) => s.travelOpen);
    const episodeEndOpen = useStore((s) => s.episodeEndOpen);
    const sleeping = useStore((s) => s.sleeping);
    const layerRef = useRef<HTMLDivElement | null>(null);
    const nodesRef = useRef<Map<string, HTMLButtonElement>>(new Map());

    const hidden = !!dialogue || phoneOpen || travelOpen || episodeEndOpen || sleeping;

    // Filtered to this room. This is the fix for labels bleeding between scenes.
    const interactions: Interaction[] = activeInteractions(game).filter(
        (i) => ANCHORS[i.id]?.scene === game.scene
    );
    const signature = interactions.map((i) => i.id).join('|') + '/' + game.scene;

    // Drop stale element references whenever the room or the list changes, so a
    // button belonging to the previous scene can never be reused.
    useEffect(() => {
        nodesRef.current.clear();
    }, [signature]);

    useEffect(() => {
        if (!world || hidden || interactions.length === 0) return;
        let raf = 0;
        const ids = interactions.map((i) => i.id);
        const loop = () => {
            raf = requestAnimationFrame(loop);
            const spots = world.projectLabels(ids);
            // Anything without a fresh position this frame is hidden outright.
            const seen = new Set<string>();
            for (const spot of spots) {
                const el = nodesRef.current.get(spot.id);
                if (!el) continue;
                seen.add(spot.id);
                el.style.opacity = spot.visible ? '1' : '0';
                el.style.pointerEvents = spot.visible ? 'auto' : 'none';
                el.style.transform = `translate(${spot.x}px, ${spot.y}px) translate(-50%, -100%)`;
            }
            for (const [id, el] of nodesRef.current) {
                if (seen.has(id)) continue;
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
            }
        };
        loop();
        return () => cancelAnimationFrame(raf);
    }, [world, hidden, signature]);

    if (hidden || !world) return null;

    return (
        <div className="label-layer" ref={layerRef} key={game.scene}>
            {interactions.map((interaction) => (
                <button
                    key={game.scene + '/' + interaction.id + '/' + interaction.node}
                    type="button"
                    ref={(el) => {
                        if (el) nodesRef.current.set(interaction.id, el);
                        else nodesRef.current.delete(interaction.id);
                    }}
                    className={interaction.key ? 'world-label key' : 'world-label'}
                    style={{ opacity: 0 }}
                    onPointerDown={(e) => { e.stopPropagation(); }}
                    onClick={(e) => { e.stopPropagation(); onPick(interaction.id); }}
                >
                    {interaction.label}
                </button>
            ))}
        </div>
    );
}
