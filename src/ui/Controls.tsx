/**
 * Movement controls: an on-screen thumb stick (touch) plus a contextual action
 * button that appears when the player is standing next to something they can
 * interact with. WASD / arrow keys are handled inside the 3D world.
 */
import { useEffect, useRef, useState } from 'react';

interface Props {
    onStick(x: number, y: number): void;
    actionLabel: string | null;
    onAction(): void;
}

const RADIUS = 46;

export default function Controls({ onStick, actionLabel, onAction }: Props) {
    const padRef = useRef<HTMLDivElement | null>(null);
    const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
    const activeId = useRef<number | null>(null);

    useEffect(() => () => onStick(0, 0), [onStick]);

    const update = (clientX: number, clientY: number) => {
        const pad = padRef.current;
        if (!pad) return;
        const rect = pad.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > RADIUS) {
            dx = (dx / dist) * RADIUS;
            dy = (dy / dist) * RADIUS;
        }
        setKnob({ x: dx, y: dy });
        onStick(dx / RADIUS, dy / RADIUS);
    };

    const release = () => {
        activeId.current = null;
        setKnob(null);
        onStick(0, 0);
    };

    return (
        <>
            <div
                ref={padRef}
                className="stick-pad"
                onPointerDown={(e) => {
                    e.preventDefault();
                    activeId.current = e.pointerId;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    update(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                    if (activeId.current !== e.pointerId) return;
                    update(e.clientX, e.clientY);
                }}
                onPointerUp={release}
                onPointerCancel={release}
                onLostPointerCapture={release}
            >
                <span className="stick-ring" />
                <span
                    className="stick-knob"
                    style={knob ? { transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` } : undefined}
                />
                <span className="stick-caption">move</span>
            </div>

            {actionLabel && (
                <button type="button" className="action-button" onClick={onAction}>
                    <span className="action-glyph">{'\u2726'}</span>
                    <span className="action-text">{actionLabel}</span>
                </button>
            )}
        </>
    );
}
