/**
 * Model library. Loads GLB models from referenced asset packs on the RUN asset
 * CDN, caches them, and clones them into the scenes.
 *
 * Posture: every model is OPTIONAL. If a pack fails to resolve, or a single
 * model 404s, the scene keeps the procedural box that was already there. A
 * missing asset must never leave a hole in the room.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

/** Packs used by the game, with their pinned versions from referenced-files.json. */
const PACKS = {
    people: { id: 'kenney-mini-characters/3D/characters', version: '7930c0c9d00b', slug: 'kenney-mini-characters' },
    city: { id: 'kenney-city-kit-commercial/3D/city', version: 'afdd7da7a718', slug: 'kenney-city-kit-commercial' },
    suburb: { id: 'kenney-city-kit-suburban/3D/city', version: '6975daa2b595', slug: 'kenney-city-kit-suburban' },
    food: { id: 'kenney-food-kit/3D/food', version: '70eded2f62a7', slug: 'kenney-food-kit' },
    market: { id: 'kenney-mini-market/3D/city', version: '547cce98a4c6', slug: 'kenney-mini-market' },
    cars: { id: 'kenney-car-kit/3D/vehicles-racing', version: '0d265763a15b', slug: 'kenney-car-kit' },
} as const;

export type PackKey = keyof typeof PACKS;

const baseUrls = new Map<PackKey, string>();
const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);
/** Cached prototypes, keyed 'pack/name'. */
const prototypes = new Map<string, THREE.Object3D | null>();

// Procedural fallback Kenney color palette texture data URL
let fallbackColormapDataUrl = '';
function getFallbackColormap(): string {
    if (fallbackColormapDataUrl) return fallbackColormapDataUrl;
    if (typeof document === 'undefined') return '';
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const colors = [
                '#e84118', '#fbc531', '#4cd137', '#00a8ff', '#9c88ff', '#e1b12c',
                '#44bd32', '#273c75', '#353b48', '#f5f6fa', '#7f8fa6', '#718093',
                '#dcdde1', '#c23616', '#e1b12c', '#44bd32', '#192a56', '#2f3640',
                '#d2b48c', '#8b5a2b', '#5c3317', '#deb887', '#cd853f', '#f4a460',
                '#ffffff', '#aaaaaa', '#555555', '#222222', '#ff6b6b', '#feca57',
                '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#10ac84'
            ];
            const cols = 6;
            const rows = 6;
            const cellW = canvas.width / cols;
            const cellH = canvas.height / rows;
            colors.forEach((col, i) => {
                const x = (i % cols) * cellW;
                const y = Math.floor(i / cols) * cellH;
                ctx.fillStyle = col;
                ctx.fillRect(x, y, cellW, cellH);
            });
            fallbackColormapDataUrl = canvas.toDataURL('image/png');
        }
    } catch {}
    return fallbackColormapDataUrl;
}

// Redirect relative texture references to R2 bucket
manager.setURLModifier((url) => {
    if (url.includes('colormap.png')) {
        return `${R2_BUCKET_URL}/Textures/colormap.png`;
    }
    return url;
});

// Intercept texture loading errors to gracefully substitute fallback palette without console warnings
manager.onError = (url) => {
    if (url.includes('colormap.png')) {
        // Silently handled: models fallback to material color or procedural palette
    }
};

/** Resolve (and cache) a pack's URL prefix. */
/**
 * Per-pack map of pack-relative path -> absolute CDN url, read from the pack's
 * own manifest. This is the reliable route: the manifest ships in the project and
 * its urls are immutable, so it works in the preview and in the published game.
 */
const manifestUrls = new Map<PackKey, Map<string, string>>();

async function loadManifest(pack: PackKey): Promise<Map<string, string> | null> {
    const cached = manifestUrls.get(pack);
    if (cached) return cached;
    const { slug } = PACKS[pack];
    try {
        const res = await fetch(`assets/${slug}/referenced-files.json`);
        if (!res.ok) return null;
        const text = await res.text();
        // Parsed with a regex rather than JSON.parse: some manifests contain
        // characters that trip strict parsing, and we only need path + url.
        const map = new Map<string, string>();
        const entry = /"path":\s*"([^"]+)"[^}]*?"url":\s*"([^"]+)"/g;
        let match: RegExpExecArray | null;
        while ((match = entry.exec(text)) !== null) {
            map.set(match[1], match[2]);
        }
        if (map.size === 0) return null;
        manifestUrls.set(pack, map);
        return map;
    } catch {
        return null;
    }
}

/** Resolve the URL prefix for a pack via the SDK, when it is available. */
async function packBase(pack: PackKey): Promise<string | null> {
    const cached = baseUrls.get(pack);
    if (cached) return cached;
    const { id, version } = PACKS[pack];
    try {
        // assetLibrary is available at runtime on the RUN host but is not yet
        // declared on the published SDK types. Guard it so tsc is happy and
        // the local-manifest fallback still works in preview.
        const api = RundotGameAPI as any;
        if (api.assetLibrary?.getPackBaseUrl) {
            const base = await api.assetLibrary.getPackBaseUrl(id, version);
            if (base) {
                baseUrls.set(pack, base);
                return base;
            }
        }
    } catch { /* fall through to the manifest */ }
    return null;
}

const R2_BUCKET_URL = 'https://pub-d7c3135bfc1c4c92ba9902f5bc0199f7.r2.dev';

/** Absolute URL for one file: R2 bucket first, then SDK prefix, then manifest. */
async function fileUrl(pack: PackKey, file: string): Promise<string | null> {
    if (R2_BUCKET_URL) {
        const fileName = file.split('/').pop();
        if (fileName) {
            // Check if R2 has either the full path or flat filename
            return `${R2_BUCKET_URL}/${fileName}`;
        }
    }
    const base = await packBase(pack);
    if (base) return `${base}/${file}`;
    const map = await loadManifest(pack);
    return map?.get(file) ?? null;
}

/** Load one model, returning null (never throwing) if it is unavailable. */
async function loadPrototype(pack: PackKey, file: string): Promise<THREE.Object3D | null> {
    const key = pack + '/' + file;
    if (prototypes.has(key)) return prototypes.get(key)!;

    // Attempt order: R2 bucket flat filename, R2 bucket full relative path, SDK packBase, and manifest
    const candidates: string[] = [];
    const fileName = file.split('/').pop();
    if (R2_BUCKET_URL) {
        if (fileName) candidates.push(`${R2_BUCKET_URL}/${fileName}`);
        candidates.push(`${R2_BUCKET_URL}/${file}`);
    }
    const base = await packBase(pack);
    if (base) candidates.push(`${base}/${file}`);
    const map = await loadManifest(pack);
    const mUrl = map?.get(file);
    if (mUrl) candidates.push(mUrl);

    for (const url of candidates) {
        try {
            const gltf = await loader.loadAsync(url);
            const root = gltf.scene;
            root.updateMatrixWorld(true);
            let meshCount = 0;
            root.traverse((obj) => {
                const mesh = obj as THREE.Mesh;
                if (mesh.isMesh) {
                    meshCount += 1;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    mesh.visible = true;
                    mesh.frustumCulled = false;

                    // If material's colormap texture is missing, attach fallback palette so model looks colorful
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat && (!mat.map || !mat.map.image)) {
                        const fallback = getFallbackColormap();
                        if (fallback && !mat.map) {
                            new THREE.TextureLoader().load(fallback, (tex) => {
                                tex.colorSpace = THREE.SRGBColorSpace;
                                mat.map = tex;
                                mat.needsUpdate = true;
                            });
                        }
                    }
                }
            });
            if (meshCount > 0) {
                prototypes.set(key, root);
                return root;
            }
        } catch {
            // Try next candidate
        }
    }

    prototypes.set(key, null);
    return null;
}

/** Friendly names → pack + file path. */
const MODELS: Record<string, { pack: PackKey; file: string }> = {
    // People (Kenney mini characters — clean, modern, human).
    'person-f-a': { pack: 'people', file: 'Models/GLB format/character-female-a.glb' },
    'person-f-b': { pack: 'people', file: 'Models/GLB format/character-female-b.glb' },
    'person-f-c': { pack: 'people', file: 'Models/GLB format/character-female-c.glb' },
    'person-f-d': { pack: 'people', file: 'Models/GLB format/character-female-d.glb' },
    'person-f-e': { pack: 'people', file: 'Models/GLB format/character-female-e.glb' },
    'person-f-f': { pack: 'people', file: 'Models/GLB format/character-female-f.glb' },
    'person-m-a': { pack: 'people', file: 'Models/GLB format/character-male-a.glb' },
    'person-m-b': { pack: 'people', file: 'Models/GLB format/character-male-b.glb' },
    'person-m-c': { pack: 'people', file: 'Models/GLB format/character-male-c.glb' },
    'person-m-d': { pack: 'people', file: 'Models/GLB format/character-male-d.glb' },
    'person-m-e': { pack: 'people', file: 'Models/GLB format/character-male-e.glb' },
    'person-m-f': { pack: 'people', file: 'Models/GLB format/character-male-f.glb' },

    // City skyline pieces, for the views out of windows.
    'tower-a': { pack: 'city', file: 'Models/GLB format/building-skyscraper-a.glb' },
    'tower-b': { pack: 'city', file: 'Models/GLB format/building-skyscraper-b.glb' },
    'tower-c': { pack: 'city', file: 'Models/GLB format/building-skyscraper-c.glb' },
    'tower-d': { pack: 'city', file: 'Models/GLB format/building-skyscraper-d.glb' },
    'tower-e': { pack: 'city', file: 'Models/GLB format/building-skyscraper-e.glb' },
    'block-a': { pack: 'city', file: 'Models/GLB format/building-a.glb' },
    'block-b': { pack: 'city', file: 'Models/GLB format/building-e.glb' },
    'block-c': { pack: 'city', file: 'Models/GLB format/building-j.glb' },
    'block-d': { pack: 'city', file: 'Models/GLB format/building-n.glb' },
    'awning': { pack: 'city', file: 'Models/GLB format/detail-awning.glb' },
    'parasol': { pack: 'city', file: 'Models/GLB format/detail-parasol-a.glb' },

    // Suburbia, for the view from your family's house.
    'house-a': { pack: 'suburb', file: 'Models/GLB format/building-type-a.glb' },
    'house-b': { pack: 'suburb', file: 'Models/GLB format/building-type-h.glb' },
    'house-c': { pack: 'suburb', file: 'Models/GLB format/building-type-m.glb' },
    'tree-large': { pack: 'suburb', file: 'Models/GLB format/tree-large.glb' },
    'tree-small': { pack: 'suburb', file: 'Models/GLB format/tree-small.glb' },
    'fence': { pack: 'suburb', file: 'Models/GLB format/fence-1x3.glb' },
    'planter': { pack: 'suburb', file: 'Models/GLB format/planter.glb' },

    // Food + drink: desks, break areas, the bar, Sunday dinner.
    'cup-coffee': { pack: 'food', file: 'Models/GLB format/cup-coffee.glb' },
    'cup-saucer': { pack: 'food', file: 'Models/GLB format/cup-saucer.glb' },
    'cup-tea': { pack: 'food', file: 'Models/GLB format/cup-tea.glb' },
    'frappe': { pack: 'food', file: 'Models/GLB format/frappe.glb' },
    'glass': { pack: 'food', file: 'Models/GLB format/glass.glb' },
    'glass-wine': { pack: 'food', file: 'Models/GLB format/glass-wine.glb' },
    'cocktail': { pack: 'food', file: 'Models/GLB format/cocktail.glb' },
    'bottle-oil': { pack: 'food', file: 'Models/GLB format/bottle-oil.glb' },
    'can': { pack: 'food', file: 'Models/GLB format/can.glb' },
    'can-open': { pack: 'food', file: 'Models/GLB format/can-open.glb' },
    'bowl-soup': { pack: 'food', file: 'Models/GLB format/bowl-soup.glb' },
    'bowl': { pack: 'food', file: 'Models/GLB format/bowl.glb' },
    'cake': { pack: 'food', file: 'Models/GLB format/cake.glb' },
    'cake-birthday': { pack: 'food', file: 'Models/GLB format/cake-birthday.glb' },
    'donut': { pack: 'food', file: 'Models/GLB format/donut-sprinkles.glb' },
    'croissant': { pack: 'food', file: 'Models/GLB format/croissant.glb' },
    'cookie': { pack: 'food', file: 'Models/GLB format/cookie.glb' },
    'burger': { pack: 'food', file: 'Models/GLB format/burger.glb' },
    'fries': { pack: 'food', file: 'Models/GLB format/fries.glb' },
    'chinese': { pack: 'food', file: 'Models/GLB format/chinese.glb' },
    'dim-sum': { pack: 'food', file: 'Models/GLB format/dim-sum.glb' },
    'broccoli': { pack: 'food', file: 'Models/GLB format/broccoli.glb' },
    'carrot': { pack: 'food', file: 'Models/GLB format/carrot.glb' },
    'corn': { pack: 'food', file: 'Models/GLB format/corn.glb' },
    'cutting-board': { pack: 'food', file: 'Models/GLB format/cutting-board.glb' },
    'frying-pan': { pack: 'food', file: 'Models/GLB format/frying-pan.glb' },
    'honey': { pack: 'food', file: 'Models/GLB format/honey.glb' },
    'apple': { pack: 'food', file: 'Models/GLB format/apple.glb' },
    'grapes': { pack: 'food', file: 'Models/GLB format/grapes.glb' },
    'ice-cream': { pack: 'food', file: 'Models/GLB format/ice-cream-cup.glb' },

    // Shop/office fittings.
    'freezer': { pack: 'market', file: 'Models/GLB format/freezer.glb' },
    'shelf-boxes': { pack: 'market', file: 'Models/GLB format/shelf-boxes.glb' },
    'shelf-bags': { pack: 'market', file: 'Models/GLB format/shelf-bags.glb' },
    'cash-register': { pack: 'market', file: 'Models/GLB format/cash-register.glb' },
    'display-bread': { pack: 'market', file: 'Models/GLB format/display-bread.glb' },
    'display-fruit': { pack: 'market', file: 'Models/GLB format/display-fruit.glb' },
    'basket': { pack: 'market', file: 'Models/GLB format/shopping-basket.glb' },

    // Vehicles, for the street outside the windows.
    'car-sedan': { pack: 'cars', file: 'Models/GLB format/sedan.glb' },
    'car-taxi': { pack: 'cars', file: 'Models/GLB format/taxi.glb' },
    'car-van': { pack: 'cars', file: 'Models/GLB format/van.glb' },
    'car-suv': { pack: 'cars', file: 'Models/GLB format/suv.glb' },
    'car-hatch': { pack: 'cars', file: 'Models/GLB format/hatchback-sports.glb' },
    'cone': { pack: 'cars', file: 'Models/GLB format/cone.glb' },
};

export type ModelName = keyof typeof MODELS | string;

/** Warm a set of models in parallel. Never rejects. */
export async function preloadModels(names: ModelName[]): Promise<void> {
    await Promise.all(names.map(async (name) => {
        const entry = MODELS[name];
        if (!entry) return;
        await loadPrototype(entry.pack, entry.file);
    }));
}

/** True once a model is cached and usable. */
export function hasModel(name: ModelName): boolean {
    const entry = MODELS[name];
    if (!entry) return false;
    return !!prototypes.get(entry.pack + '/' + entry.file);
}

export interface PlaceOptions {
    /** Target height in world units; the model is scaled uniformly to match. */
    height?: number;
    /** Uniform scale, used when height is not given. */
    scale?: number;
    yaw?: number;
    /** Sit the model's base on this Y (default 0). */
    y?: number;
}

/**
 * Clone a loaded model, scaled and positioned. Returns null when the model is
 * not available, so callers can keep their procedural fallback.
 */
export function makeModel(name: ModelName, opts: PlaceOptions = {}): THREE.Object3D | null {
    const entry = MODELS[name];
    if (!entry) return null;
    const proto = prototypes.get(entry.pack + '/' + entry.file);
    if (!proto) return null;

    const clone = proto.clone(true);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    // Matrices must be current before measuring, or the box comes back empty.
    clone.updateMatrixWorld(true);

    // Measure the untouched model, then scale it to the height we want, so every
    // pack ends up agreeing about size regardless of its authored units.
    const box = new THREE.Box3().setFromObject(clone, true);
    if (box.isEmpty()) return null;
    const size = new THREE.Vector3();
    box.getSize(size);
    if (!isFinite(size.y) || size.y < 0.0001) return null;

    const scale = opts.height ? opts.height / size.y : (opts.scale ?? 1);
    clone.scale.setScalar(scale);
    clone.updateMatrixWorld(true);

    // Re-measure at final scale, then lift the model so its feet sit exactly on
    // the wrapper's origin. Callers place the wrapper at floor height.
    const scaled = new THREE.Box3().setFromObject(clone, true);
    clone.position.y = -scaled.min.y;
    clone.updateMatrixWorld(true);

    const group = new THREE.Group();
    group.add(clone);
    group.position.y = opts.y ?? 0;
    group.rotation.y = opts.yaw ?? 0;
    return group;
}

/** Release cached models (called when the world is torn down). */
export function disposeModels(): void {
    for (const proto of prototypes.values()) {
        proto?.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat?.dispose();
        });
    }
    prototypes.clear();
    baseUrls.clear();
    manifestUrls.clear();
}
