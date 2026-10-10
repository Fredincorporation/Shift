/**
 * Asset manifest: catalog of critical and deferred assets required by the game.
 * Critical models are warmed during the loading phase; deferred assets populate in background.
 */
import { CRITICAL_MODELS, DEFERRED_MODELS } from '../world/dressing.ts';
import type { ModelName } from '../world/models.ts';

export interface AssetBundle {
    critical: {
        models: ModelName[];
        images: string[];
    };
    deferred: {
        models: ModelName[];
        images: string[];
    };
}

export const ASSET_MANIFEST: AssetBundle = {
    critical: {
        models: CRITICAL_MODELS,
        images: ['/images/placeholder.png'],
    },
    deferred: {
        models: DEFERRED_MODELS,
        images: [],
    },
};
