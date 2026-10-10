/**
 * Scene dressing from the asset packs.
 *
 * Everything here is additive and optional: each room already looks complete
 * built from boxes, and these models are laid on top. If a pack fails to load,
 * nothing is added and nothing breaks.
 */
import * as THREE from 'three';
import { makeModel, preloadModels, type ModelName } from './models.ts';
import { OFFSETS, type SceneId } from './anchors.ts';

/**
 * Props worth having before the first frame anyone sees. Characters are drawn by
 * the built-in rig (see characterRig.ts) rather than loaded, so no people here.
 */
export const CRITICAL_MODELS: ModelName[] = [
    'cup-coffee', 'cup-saucer', 'glass',
];

/** Everything else, warmed in the background. */
export const DEFERRED_MODELS: ModelName[] = [
    'tower-a', 'tower-b', 'tower-c', 'tower-d', 'tower-e',
    'block-a', 'block-b', 'block-c', 'block-d', 'awning', 'parasol',
    'house-a', 'house-b', 'house-c', 'tree-large', 'tree-small', 'fence', 'planter',
    'cup-tea', 'frappe', 'glass-wine', 'cocktail', 'bottle-oil', 'can', 'can-open',
    'bowl-soup', 'bowl', 'cake', 'cake-birthday', 'donut', 'croissant', 'cookie',
    'burger', 'fries', 'chinese', 'dim-sum', 'broccoli', 'carrot', 'corn',
    'cutting-board', 'frying-pan', 'honey', 'apple', 'grapes', 'ice-cream',
    'freezer', 'shelf-boxes', 'shelf-bags', 'cash-register', 'display-bread',
    'display-fruit', 'basket',
    'car-sedan', 'car-taxi', 'car-van', 'car-suv', 'car-hatch', 'cone',
];

export async function preloadCritical(): Promise<void> {
    await preloadModels(CRITICAL_MODELS);
}
export function preloadDeferred(): void {
    void preloadModels(DEFERRED_MODELS);
}

interface Placement {
    name: ModelName;
    x: number;
    y?: number;
    z: number;
    height?: number;
    scale?: number;
    yaw?: number;
}

/** Add a list of models into a room, skipping any that failed to load. */
function addAll(target: THREE.Group, scene: SceneId, items: Placement[]): void {
    const offset = OFFSETS[scene];
    for (const item of items) {
        const model = makeModel(item.name, {
            height: item.height,
            scale: item.scale,
            yaw: item.yaw,
            y: item.y ?? 0,
        });
        if (!model) continue;
        model.position.x = offset + item.x;
        model.position.z = item.z;
        // Distant scenery (skylines, cars, houses) neither casts nor receives
        // shadows — it is far outside the shadow camera and only costs time.
        const distant = item.z < -5.5 || item.z > 5.5;
        if (distant) {
            model.traverse((obj: THREE.Object3D) => {
                const mesh = obj as THREE.Mesh;
                if (mesh.isMesh) { mesh.castShadow = false; mesh.receiveShadow = false; }
            });
        }
        target.add(model);
    }
}

/**
 * Dress every room. Called once the critical models are warm; safe to call
 * again when deferred models arrive, because it builds into a fresh group.
 */
export function dressRooms(scene: THREE.Scene): THREE.Group {
    const group = new THREE.Group();
    group.name = 'dressing';

    /* ------------------------------ STUDIO ------------------------------- */
    addAll(group, 'studio', [
        // Real mugs on the desks instead of boxes.
        { name: 'cup-coffee', x: -0.02, y: 0.78, z: -3.42, height: 0.13 },
        { name: 'cup-coffee', x: -4.02, y: 0.78, z: -3.22, height: 0.13 },
        { name: 'cup-saucer', x: 4.0, y: 0.78, z: -4.12, height: 0.11 },
        { name: 'frappe', x: -5.8, y: 0.78, z: -0.72, height: 0.17 },
        { name: 'cup-coffee', x: -3.0, y: 0.78, z: -0.72, height: 0.13 },
        // Nadia's junior desk clutter (tea and pastry).
        { name: 'cup-tea', x: -1.4, y: 0.78, z: -3.4, height: 0.11 },
        { name: 'donut', x: -1.15, y: 0.78, z: -3.2, height: 0.08 },
        // Tara's audit desk (pristine tea saucer and sanitiser).
        { name: 'cup-saucer', x: -5.2, y: 0.78, z: 1.0, height: 0.11 },
        // Break area: a proper coffee counter.
        { name: 'display-bread', x: 4.3, y: 0.95, z: 3.7, height: 0.34, yaw: Math.PI },
        { name: 'donut', x: 3.1, y: 0.75, z: 4.3, height: 0.09 },
        { name: 'croissant', x: 3.6, y: 0.75, z: 4.15, height: 0.08 },
        { name: 'cookie', x: 3.35, y: 0.75, z: 4.45, height: 0.05 },
        { name: 'cup-coffee', x: 4.9, y: 0.96, z: 3.5, height: 0.13 },
        { name: 'cup-coffee', x: 5.05, y: 0.96, z: 3.9, height: 0.13 },
        // Storage shelving along the left wall.
        { name: 'shelf-boxes', x: -6.2, z: 0.6, height: 1.5, yaw: Math.PI / 2 },
        { name: 'shelf-bags', x: -6.2, z: 3.4, height: 1.5, yaw: Math.PI / 2 },
        { name: 'basket', x: -5.0, z: 4.4, height: 0.28 },
    ]);

    /* ------------------------------- HOME -------------------------------- */
    addAll(group, 'home', [
        // Desk: a mug and an energy can that say "still working".
        { name: 'cup-coffee', x: -2.15, y: 0.78, z: -3.35, height: 0.13 },
        { name: 'can', x: -3.05, y: 0.78, z: -3.3, height: 0.14 },
        // Kitchen counter.
        { name: 'frying-pan', x: 3.55, y: 0.98, z: 3.3, height: 0.09 },
        { name: 'cutting-board', x: 2.7, y: 0.98, z: 3.35, height: 0.06 },
        { name: 'carrot', x: 2.62, y: 1.02, z: 3.3, height: 0.05, yaw: 0.6 },
        { name: 'broccoli', x: 2.85, y: 1.02, z: 3.42, height: 0.09 },
        { name: 'bowl', x: 3.95, y: 0.98, z: 3.42, height: 0.09 },
        { name: 'apple', x: 4.25, y: 1.0, z: 3.2, height: 0.07 },
        // Coffee table: takeaway, because of course.
        { name: 'chinese', x: -2.4, y: 0.47, z: 1.35, height: 0.13 },
        { name: 'glass', x: -2.05, y: 0.47, z: 1.5, height: 0.12 },
        // Nightstand.
        { name: 'cup-tea', x: 1.85, y: 0.56, z: -2.85, height: 0.1 },
        // The city out of the window, and a street below it.
        { name: 'tower-a', x: -3.4, z: -9.5, height: 6.2 },
        { name: 'tower-c', x: -0.4, z: -10.8, height: 8.4 },
        { name: 'tower-b', x: 2.8, z: -9.8, height: 5.4 },
        { name: 'block-b', x: 5.2, z: -8.8, height: 3.6 },
        { name: 'block-d', x: -6.2, z: -8.4, height: 3.2 },
        { name: 'car-taxi', x: -1.6, z: -6.2, height: 0.62, yaw: Math.PI / 2 },
        { name: 'car-sedan', x: 1.4, z: -6.2, height: 0.6, yaw: -Math.PI / 2 },
    ]);

    /* -------------------------------- BAR -------------------------------- */
    addAll(group, 'bar', [
        // Glassware along the counter, replacing the box tumblers.
        { name: 'glass', x: 3.4, y: 1.16, z: -3.3, height: 0.15 },
        { name: 'glass', x: 3.72, y: 1.16, z: -3.3, height: 0.15 },
        { name: 'glass-wine', x: 4.04, y: 1.16, z: -3.32, height: 0.19 },
        { name: 'cocktail', x: 4.36, y: 1.16, z: -3.28, height: 0.18 },
        { name: 'glass', x: 1.1, y: 1.16, z: -3.05, height: 0.15 },
        { name: 'glass-wine', x: 1.9, y: 1.16, z: -3.1, height: 0.19 },
        { name: 'can-open', x: 2.65, y: 1.16, z: -3.0, height: 0.13 },
        // Bottles on the back shelf.
        { name: 'bottle-oil', x: 0.6, y: 1.62, z: -4.3, height: 0.3 },
        { name: 'bottle-oil', x: 1.35, y: 1.62, z: -4.3, height: 0.3 },
        { name: 'bottle-oil', x: 2.1, y: 2.12, z: -4.3, height: 0.3 },
        { name: 'bottle-oil', x: 3.6, y: 2.12, z: -4.3, height: 0.3 },
        // Booth tables: drinks and bar snacks.
        { name: 'glass', x: -3.1, y: 0.75, z: -2.6, height: 0.15 },
        { name: 'glass', x: -2.85, y: 0.75, z: -2.45, height: 0.15 },
        { name: 'fries', x: -3.3, y: 0.75, z: -2.75, height: 0.12 },
        { name: 'glass-wine', x: -3.1, y: 0.75, z: -0.6, height: 0.19 },
        { name: 'glass', x: -3.1, y: 0.75, z: 1.4, height: 0.15 },
        { name: 'burger', x: -2.9, y: 0.75, z: 1.55, height: 0.11 },
        { name: 'glass', x: 0.4, y: 1.05, z: 1.6, height: 0.15 },
        { name: 'glass', x: 0.55, y: 1.05, z: 3.4, height: 0.15 },
        // The street outside the window.
        { name: 'block-a', x: -4.6, z: -8.6, height: 3.4 },
        { name: 'block-c', x: -1.4, z: -9.2, height: 4.2 },
        { name: 'tower-e', x: 2.2, z: -10.2, height: 6.6 },
        { name: 'car-van', x: -2.6, z: -6.0, height: 0.78, yaw: Math.PI / 2 },
        { name: 'car-hatch', x: 0.4, z: -6.0, height: 0.58, yaw: -Math.PI / 2 },
        { name: 'awning', x: -2.2, y: 2.2, z: -4.9, height: 0.5 },
    ]);

    /* ------------------------------ FAMILY ------------------------------- */
    addAll(group, 'family', [
        // Sunday dinner, properly laid.
        { name: 'chinese', x: 0.5, y: 0.84, z: -2.0, height: 0.16 },
        { name: 'bowl-soup', x: 1.1, y: 0.84, z: -2.0, height: 0.11 },
        { name: 'broccoli', x: 1.7, y: 0.86, z: -2.0, height: 0.12 },
        { name: 'corn', x: 2.3, y: 0.86, z: -2.05, height: 0.1, yaw: 0.4 },
        { name: 'cake', x: 1.4, y: 0.84, z: -1.35, height: 0.16 },
        { name: 'glass', x: 0.45, y: 0.84, z: -2.85, height: 0.13 },
        { name: 'glass', x: 1.55, y: 0.84, z: -2.85, height: 0.13 },
        { name: 'glass', x: 2.65, y: 0.84, z: -2.85, height: 0.13 },
        { name: 'glass', x: 0.45, y: 0.84, z: -1.15, height: 0.13 },
        { name: 'glass', x: 1.55, y: 0.84, z: -1.15, height: 0.13 },
        { name: 'glass', x: 2.65, y: 0.84, z: -1.15, height: 0.13 },
        // Kitchen side.
        { name: 'frying-pan', x: 3.3, y: 1.0, z: 1.0, height: 0.1 },
        { name: 'cutting-board', x: 4.6, y: 1.0, z: 1.05, height: 0.06 },
        { name: 'grapes', x: 4.62, y: 1.04, z: 1.0, height: 0.08 },
        { name: 'honey', x: 4.95, y: 1.0, z: 1.15, height: 0.12 },
        { name: 'cup-tea', x: 3.9, y: 1.0, z: 0.8, height: 0.1 },
        { name: 'cup-tea', x: 4.15, y: 1.0, z: 0.95, height: 0.1 },
        // Living side: tea on the coffee table.
        { name: 'cup-saucer', x: -2.2, y: 0.47, z: 1.0, height: 0.11 },
        { name: 'cookie', x: -2.6, y: 0.47, z: 0.95, height: 0.05 },
        // The garden and the street beyond it.
        { name: 'tree-large', x: 4.6, z: -7.4, height: 4.2 },
        { name: 'tree-small', x: 1.8, z: -6.8, height: 2.4 },
        { name: 'tree-small', x: 6.6, z: -6.4, height: 2.1 },
        { name: 'fence', x: 2.6, z: -5.9, height: 0.7 },
        { name: 'fence', x: 4.4, z: -5.9, height: 0.7 },
        { name: 'fence', x: 6.2, z: -5.9, height: 0.7 },
        { name: 'planter', x: 3.4, z: -5.4, height: 0.45 },
        { name: 'house-a', x: 0.4, z: -11.0, height: 3.6 },
        { name: 'house-b', x: 4.8, z: -11.4, height: 3.2 },
        { name: 'house-c', x: 9.0, z: -10.8, height: 3.4 },
    ]);

    /* ----------------------------- PUBLISHER ----------------------------- */
    addAll(group, 'publisher', [
        // Water glasses at every seat: a room that runs on meetings.
        { name: 'glass', x: -1.75, y: 0.86, z: -1.65, height: 0.14 },
        { name: 'glass', x: -0.45, y: 0.86, z: -1.65, height: 0.14 },
        { name: 'glass', x: 0.85, y: 0.86, z: -1.65, height: 0.14 },
        { name: 'glass', x: 2.15, y: 0.86, z: -1.65, height: 0.14 },
        { name: 'glass', x: -1.75, y: 0.86, z: -0.75, height: 0.14 },
        { name: 'glass', x: -0.45, y: 0.86, z: -0.75, height: 0.14 },
        { name: 'glass', x: 0.85, y: 0.86, z: -0.75, height: 0.14 },
        { name: 'glass', x: 2.15, y: 0.86, z: -0.75, height: 0.14 },
        { name: 'cup-saucer', x: -1.2, y: 0.86, z: -1.2, height: 0.11 },
        { name: 'cup-saucer', x: 1.4, y: 0.86, z: -1.2, height: 0.11 },
        // Reception: an expensive coffee machine and a fruit display.
        { name: 'cash-register', x: -4.2, y: 1.15, z: 3.2, height: 0.3, yaw: Math.PI },
        { name: 'display-fruit', x: 2.0, y: 0.42, z: 2.1, height: 0.26 },
        { name: 'frappe', x: 1.4, y: 0.44, z: 1.85, height: 0.18 },
        // The city, eleven floors down.
        { name: 'tower-a', x: -7.2, z: -12.0, height: 9.5 },
        { name: 'tower-b', x: -2.6, z: -13.0, height: 11.0 },
        { name: 'tower-d', x: 2.4, z: -12.2, height: 8.5 },
        { name: 'tower-e', x: 7.0, z: -13.2, height: 10.0 },
        { name: 'block-a', x: -4.8, z: -9.0, height: 4.0 },
        { name: 'block-c', x: 4.6, z: -9.2, height: 4.4 },
    ]);

    /* ------------------------------ ROOFTOP ------------------------------ */
    addAll(group, 'rooftop', [
        // Cups and cans left by people taking five.
        { name: 'cup-coffee', x: -3.0, y: 0.57, z: 1.8, height: 0.13 },
        { name: 'cup-coffee', x: -3.75, y: 0.57, z: 1.8, height: 0.13 },
        { name: 'can-open', x: -1.2, y: 0.72, z: 2.4, height: 0.13 },
        { name: 'can', x: 1.55, y: 0.73, z: 0.9, height: 0.14 },
        { name: 'cup-coffee', x: 1.9, y: 0.73, z: 0.85, height: 0.13 },
        { name: 'fries', x: 1.7, y: 0.73, z: 1.1, height: 0.12 },
        // Somebody's tomato buckets, made real.
        { name: 'planter', x: -5.0, z: 3.6, height: 0.5 },
        { name: 'planter', x: -4.2, z: 4.0, height: 0.42 },
        { name: 'planter', x: 0.6, z: 4.2, height: 0.46 },
        { name: 'cone', x: 4.6, z: -0.4, height: 0.4 },
        // The skyline, which is the whole reason to come up here.
        { name: 'tower-b', x: -8.5, z: -12.5, height: 10.5 },
        { name: 'tower-c', x: -3.5, z: -13.5, height: 12.0 },
        { name: 'tower-a', x: 1.5, z: -12.0, height: 9.0 },
        { name: 'tower-d', x: 6.5, z: -13.0, height: 11.0 },
        { name: 'tower-e', x: 11.0, z: -12.4, height: 8.5 },
        { name: 'block-a', x: -6.0, z: -8.5, height: 4.5 },
        { name: 'block-b', x: -1.0, z: -8.0, height: 3.8 },
        { name: 'block-c', x: 4.0, z: -8.6, height: 4.8 },
        { name: 'block-d', x: 9.0, z: -8.2, height: 4.0 },
    ]);

    /* ------------------------------- CLINIC ------------------------------ */
    addAll(group, 'clinic', [
        // Reception desk clutter.
        { name: 'cup-tea', x: -4.2, y: 1.2, z: -2.85, height: 0.1 },
        { name: 'cash-register', x: -2.3, y: 1.2, z: -3.0, height: 0.26, yaw: Math.PI },
        // Waiting area: a water cooler cup and a sad vending selection.
        { name: 'glass', x: 1.7, y: 0.47, z: 2.0, height: 0.12 },
        { name: 'freezer', x: 4.6, z: -0.2, height: 1.5, yaw: -Math.PI / 2 },
        { name: 'basket', x: -0.9, z: 3.6, height: 0.3 },
        // A view of a grey afternoon: parked cars, nothing more.
        { name: 'car-sedan', x: 2.4, z: 7.0, height: 0.6, yaw: Math.PI / 2 },
        { name: 'car-suv', x: 4.6, z: 7.0, height: 0.72, yaw: Math.PI / 2 },
        { name: 'block-b', x: 3.4, z: 10.5, height: 3.6 },
    ]);

    /* ------------------------------ HOSPITAL ------------------------------ */
    addAll(group, 'hospital', [
        // Bedside tables and drink mugs.
        { name: 'glass', x: 3.46, y: 0.74, z: -2.4, height: 0.13 },
        { name: 'cup-tea', x: 3.46, y: 0.74, z: -2.14, height: 0.11 },
        { name: 'grapes', x: 3.46, y: 0.75, z: -2.7, height: 0.08 },
        // Nurses station counter.
        { name: 'cup-coffee', x: -2.1, y: 1.18, z: -3.3, height: 0.13 },
        { name: 'shelf-boxes', x: -4.8, z: -3.4, height: 1.4, yaw: Math.PI / 2 },
        // Vending and corridor waiting area.
        { name: 'can', x: -3.4, y: 0.49, z: 1.5, height: 0.13 },
        { name: 'planter', x: 4.6, z: 3.6, height: 0.52 },
        // Skyline past the Ward 6 window.
        { name: 'tower-b', x: 2.2, z: 8.8, height: 7.5 },
        { name: 'tower-c', x: 5.2, z: 9.4, height: 9.0 },
        { name: 'block-d', x: 0.2, z: 7.8, height: 4.0 },
    ]);

    scene.add(group);
    return group;
}
