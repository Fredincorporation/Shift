/**
 * GameCanvas.tsx - React <-> 3D world boundary (Three.js adaptation of the
 * template's Pixi GameCanvas). Mounts the world into a host div, keeps the
 * resize wiring in one place, and freezes interaction while `store.paused`.
 */
import { useEffect, useRef } from 'react';
import { store } from '../state/store.ts';
import { createWorld, type WorldHandle } from '../world/world.ts';
import { createStage, type StageHandle } from './stage.ts';

interface GameCanvasProps {
    onWorld: (handle: WorldHandle | null) => void;
    isBlocked: () => boolean;
    onInteract: (id: string) => void;
    onWalkChange: (walking: boolean) => void;
    onNearestChange: (id: string | null) => void;
    onRoomChanged: (scene: string) => void;
}

export default function GameCanvas({
    onWorld,
    isBlocked,
    onInteract,
    onWalkChange,
    onNearestChange,
    onRoomChanged,
}: GameCanvasProps) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const worldRef = useRef<WorldHandle | null>(null);
    const stageRef = useRef<StageHandle | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const stage = createStage(host);
        stageRef.current = stage;

        const handle = createWorld(host, {
            onInteract,
            onWalkChange,
            getActive: () => [],
            isBlocked: () => store.get().paused || isBlocked(),
            onNearestChange,
            onRoomChanged,
        });
        worldRef.current = handle;
        onWorld(handle);

        const unsubResize = stage.onResize(() => handle.resize());

        return () => {
            unsubResize();
            handle.dispose();
            worldRef.current = null;
            stageRef.current = null;
            onWorld(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={hostRef} className="canvas-host" />;
}
