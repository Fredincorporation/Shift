/**
 * Asset preloading coordinator: warms 3D model prototypes, textures, and assets.
 */
import { preloadCritical, preloadDeferred } from '../world/dressing.ts';
import { ASSET_MANIFEST } from './manifest.ts';

export async function warmAssets(onProgress?: (ratio: number) => void): Promise<void> {
    const total = ASSET_MANIFEST.critical.models.length;
    let completed = 0;

    if (total === 0) {
        onProgress?.(1);
    } else {
        await preloadCritical();
        completed = total;
        onProgress?.(1);
    }

    // Deferred models warmed in background
    setTimeout(() => {
        preloadDeferred();
    }, 100);
}
