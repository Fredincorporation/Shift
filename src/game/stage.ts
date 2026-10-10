/**
 * stage.ts - Canvas host sizing & design-unit helpers.
 *
 * The 3D diorama renders into a CSS-sized host element (the `#app-frame` area).
 * This module centralizes how the canvas fills the device frame and how
 * resize / orientation changes propagate to the renderer.
 */

export interface StageHandle {
    /** Observe host element size changes; returns an unsubscribe fn. */
    onResize(cb: () => void): () => void;
    /** Current host size in CSS pixels. */
    size(): { width: number; height: number };
}

export function createStage(host: HTMLElement): StageHandle {
    const listeners = new Set<() => void>();

    const observer = new ResizeObserver(() => {
        for (const cb of listeners) cb();
    });
    observer.observe(host);

    const onOrientation = () => {
        for (const cb of listeners) cb();
    };
    window.addEventListener('orientationchange', onOrientation);

    return {
        onResize(cb) {
            listeners.add(cb);
            return () => {
                listeners.delete(cb);
            };
        },
        size() {
            const rect = host.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        },
    };
}
