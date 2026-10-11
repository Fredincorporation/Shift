/**
 * The playing screen: mounts the 3D world, connects movement + interaction to
 * the story engine, and stacks the overlays above it.
 *
 * Right-handed layout: the movement stick sits LEFT only if the player is
 * left-handed; by default the stick is on the RIGHT under the thumb, with the
 * phone and room map on the left.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { store, useStore } from '../state/store.ts';
import { createWorld, type WorldHandle } from '../world/world.ts';
import {
    activeInteractions, keyInteraction, nightFactor, nodeFocus, objective, openNode,
    persist, track,
} from '../story/runtime.ts';
import { INTERACTIONS, NODES } from '../story/story.ts';
import { ANCHORS } from '../world/anchors.ts';
import DialogueOverlay from './DialogueOverlay.tsx';
import PhoneOverlay from './PhoneOverlay.tsx';
import TravelSheet from './TravelSheet.tsx';
import EpisodeEnd from './EpisodeEnd.tsx';
import Hud from './Hud.tsx';

// Host lifecycle telemetry — registered exactly once, at module scope.
try {
    RundotGameAPI.lifecycles.onPause(() => RundotGameAPI.analytics.recordCustomEvent('game_paused'));
    RundotGameAPI.lifecycles.onResume(() => RundotGameAPI.analytics.recordCustomEvent('game_resumed'));
    RundotGameAPI.lifecycles.onSleep(() => RundotGameAPI.analytics.recordCustomEvent('game_sleep'));
    RundotGameAPI.lifecycles.onQuit(() => RundotGameAPI.analytics.recordCustomEvent('game_quit'));
} catch {
    /* lifecycle hooks unavailable outside the RUN host */
}

function nodeFor(id: string, beat: string, visited: string[]): string | null {
    const match = INTERACTIONS.find(
        (i) => i.id === id && i.beats.includes(beat) && !(i.once && visited.includes(i.node))
    );
    return match?.node ?? null;
}

export default function GameView() {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const worldRef = useRef<WorldHandle | null>(null);
    const [world, setWorld] = useState<WorldHandle | null>(null);
    const [nearest, setNearest] = useState<string | null>(null);

    const game = useStore((s) => s.game);
    const dialogue = useStore((s) => s.dialogue);
    const paused = useStore((s) => s.paused);
    const phoneOpen = useStore((s) => s.phoneOpen);
    const travelOpen = useStore((s) => s.travelOpen);
    const episodeEndOpen = useStore((s) => s.episodeEndOpen);
    const sleeping = useStore((s) => s.sleeping);

    const runInteraction = useCallback((id: string) => {
        const current = store.get().game;
        const node = nodeFor(id, current.beat, current.visited);
        if (!node) return;
        track('world_interaction_started', { target: id, node, beat: current.beat });
        openNode(node);
    }, []);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const handle = createWorld(host, {
            onInteract: (id) => runInteraction(id),
            onWalkChange: (walking) => store.patch({ walking }),
            getActive: () => activeInteractions(store.get().game).map((i) => i.id),
            isBlocked: () => {
                const s = store.get();
                return !!s.dialogue || s.phoneOpen || s.travelOpen || s.episodeEndOpen || s.sleeping;
            },
            onNearestChange: (id) => setNearest(id),
            // The player walked into another room — keep the story's idea of
            // where they are (and the header) in step with the camera.
            onRoomChanged: (scene) => {
                const current = store.get().game;
                if (current.scene === scene) return;
                // Clear anything that belonged to the room being left.
                setNearest(null);
                const next = { ...current, scene };
                store.patch({ game: next });
                persist(next);
                track('room_entered', { room: scene, beat: current.beat });
            },
        });
        worldRef.current = handle;
        setWorld(handle);

        const initial = store.get();
        handle.setScene(initial.game.scene, true);
        handle.setCast(initial.game.scene);
        handle.setMood(nightFactor(initial.game.dayLabel), initial.game.burnout);
        handle.setPromoted(initial.game.promoted);
        handle.setKeptPromise(initial.game.family_bond >= 78 || initial.game.legacy_seeds.chose_family);
        if (initial.game.node) openNode(initial.game.node);
        else if (!initial.game.visited.includes('intro')) openNode('intro');

        const onResize = () => handle.resize();
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
            handle.dispose();
            worldRef.current = null;
            setWorld(null);
        };
    }, [runInteraction]);

    useEffect(() => {
        worldRef.current?.setMood(nightFactor(game.dayLabel), game.burnout);
    }, [game.dayLabel, game.burnout]);

    useEffect(() => {
        worldRef.current?.setPromoted(game.promoted);
    }, [game.promoted]);

    useEffect(() => {
        worldRef.current?.setKeptPromise(game.family_bond >= 78 || game.legacy_seeds.chose_family);
    }, [game.family_bond, game.legacy_seeds.chose_family]);

    useEffect(() => {
        worldRef.current?.setCast(game.scene);
    }, [game.scene, game.beat]);

    // When the STORY moves you (a new day, a scene change in a node), the world
    // teleports the character into that room. When YOU walk into another room,
    // onRoomChanged has already updated game.scene, so setScene sees you are
    // there and leaves you alone — the two can never fight.
    useEffect(() => {
        // A change of room clears any leftover contextual UI from the last one.
        setNearest(null);
        worldRef.current?.setScene(game.scene);
    }, [game.scene]);

    // Seating, sleeping and character focus all follow the open node.
    useEffect(() => {
        const handle = worldRef.current;
        if (!handle) return;
        handle.focusOn(dialogue ? nodeFocus(dialogue.nodeId) : null);
        if (!dialogue) {
            handle.standUp();
            handle.setFade(0);
            return;
        }
        const node = NODES[dialogue.nodeId];
        if (node?.seatAt) handle.sitAt(node.seatAt, node.seatAt === 'home_desk' ? 'type' : 'sit');
    }, [dialogue]);

    // Sleeping: the player lies on the bed, the room dims to black, and the next
    // morning fades in wherever the story has moved them.
    const sleepNode = !!(dialogue && NODES[dialogue.nodeId]?.sleep);
    useEffect(() => {
        const handle = worldRef.current;
        if (!handle) return;
        if (sleepNode) handle.sitAt('home_bed', 'sit');

        // Fading OUT while the sleep beat plays or the gap is running;
        // fading IN otherwise.
        const goingDark = sleepNode || sleeping;
        let raf = 0;
        const started = performance.now();
        const from = goingDark ? 0 : 1;
        const to = goingDark ? 1 : 0;
        const span = goingDark ? 1400 : 900;
        const step = () => {
            const t = Math.min(1, (performance.now() - started) / span);
            handle.setFade(from + (to - from) * t);
            if (t < 1) raf = requestAnimationFrame(step);
        };
        step();
        return () => cancelAnimationFrame(raf);
    }, [sleepNode, sleeping, game.scene, game.dayLabel]);

    // The episode-end screen appears once, when the story reaches the epilogue.
    useEffect(() => {
        const epilogueFlag =
            game.beat === 'epilogue' ? '__ep1_shown' :
                game.beat === 'ep2_epilogue' ? '__ep2_shown' :
                    game.beat === 'ep3_epilogue' ? '__ep3_shown' :
                        game.beat === 'ep4_epilogue' ? '__ep4_shown' :
                            game.beat === 'ep5_epilogue' ? '__ep5_shown' :
                                game.beat === 'ep6_epilogue' ? '__ep6_shown' :
                                    game.beat === 'ep7_epilogue' ? '__ep7_shown' : null;
        if (epilogueFlag && !dialogue && !game.visited.includes(epilogueFlag)) {
            store.patch({
                episodeEndOpen: true,
                game: { ...store.get().game, visited: [...store.get().game.visited, epilogueFlag] },
            });
            track('episode_end_shown', {
                beat: game.beat,
                burnout: game.burnout,
                mara_trust: game.mara_trust,
                family_bond: game.family_bond,
                places: game.unlocked.length,
            });
        }
    }, [game.beat, dialogue, game.visited]);

    const handleStick = useCallback((x: number, y: number) => {
        worldRef.current?.setStick(x, y);
    }, []);

    const goal = objective(game);
    const key = keyInteraction(game);
    const nearestLabel = nearest
        ? activeInteractions(game).find((i) => i.id === nearest)?.label ?? null
        : null;
    const overlayUp = !!dialogue || phoneOpen || travelOpen || episodeEndOpen || sleeping;

    // Where the objective's action actually lives, so the button does the right
    // thing: open Travel for another location, walk over inside this one.
    const keyScene = key ? ANCHORS[key.id]?.scene : undefined;
    const keyElsewhere = !!keyScene && keyScene !== game.scene;

    const followObjective = () => {
        if (!key) return;
        track('objective_followed', { target: key.id, beat: game.beat, elsewhere: keyElsewhere });
        if (keyElsewhere) {
            store.patch({ travelOpen: true });
            return;
        }
        worldRef.current?.goTo(key.id);
    };

    return (
        <div className="game-root">
            <div ref={hostRef} className="canvas-host" />

            <Hud
                world={world}
                worldRef={worldRef}
                nearest={nearest}
                nearestLabel={nearestLabel}
                runInteraction={runInteraction}
                handleStick={handleStick}
                goal={goal}
                keyInteractionTarget={key}
                keyElsewhere={keyElsewhere}
                followObjective={followObjective}
            />

            <DialogueOverlay />
            <PhoneOverlay />
            <TravelSheet />
            {episodeEndOpen && <EpisodeEnd />}

            {(game.beat === 'epilogue' || game.beat === 'ep2_epilogue') && !overlayUp && (
                <button
                    type="button"
                    className="ep-reopen"
                    onClick={() => { store.patch({ episodeEndOpen: true }); track('episode_end_reopened', { beat: game.beat }); }}
                >
                    {game.beat === 'ep2_epilogue' ? 'Episode 2 summary' : 'Episode 1 summary'}
                </button>
            )}

            {paused && <div className="pause-layer">Paused</div>}
        </div>
    );
}
