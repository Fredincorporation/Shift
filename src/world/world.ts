/**
 * The 3D world: fixed isometric camera, both dioramas, the animated cast, and
 * three ways to move — an on-screen stick, WASD/arrow keys, and tapping the
 * floor. Interaction targets are real 3D hitboxes, so tapping a person or prop
 * walks you there and opens the conversation.
 */
import * as THREE from 'three';
import { createRig, type Rig } from './characterRig.ts';
import { createNavGrid, type NavGrid } from './nav.ts';
import { createStudio, createApartment, disposeDioramaPools, type Diorama } from './diorama.ts';
import { createBar, createFamilyHouse, createPublisher } from './rooms.ts';
import { dressRooms, preloadCritical, preloadDeferred } from './dressing.ts';
import { disposeModels } from './models.ts';
import { createClinic, createRooftop } from './rooms2.ts';
import { createHospital } from './rooms3.ts';
import { ANCHORS, LOCATIONS, OFFSETS, ROOM_BOUNDS, SEATS, type SceneId } from './anchors.ts';
import { store } from '../state/store.ts';

export interface LabelSpot {
    id: string;
    x: number;
    y: number;
    visible: boolean;
}

export interface WorldOptions {
    /** Fired when the player reaches an interaction target they picked. */
    onInteract(id: string): void;
    /** Fired when walking starts/stops so the UI can react. */
    onWalkChange(walking: boolean): boolean | void;
    /** Ids the player may currently interact with. */
    getActive(): string[];
    /** True while a dialogue is open — input is ignored then. */
    isBlocked(): boolean;
    /** Nearest reachable interaction changed (for the contextual action button). */
    onNearestChange(id: string | null): void;
    /** The player has physically walked/moved into a different room. */
    onRoomChanged?(scene: SceneId): void;
}

export interface WorldHandle {
    resize(): void;
    goTo(id: string): void;
    setScene(scene: SceneId, instant?: boolean): void;
    setMood(night: number, burnout: number): void;
    setPromoted(on: boolean): void;
    /** Sunday-dinner dressing at the family house. */
    setKeptPromise(on: boolean): void;
    setCast(scene: SceneId): void;
    focusOn(who: string | null): void;
    setPlayerPose(pose: 'idle' | 'sit' | 'type' | 'review'): void;
    /** Seat the player on a real piece of furniture (couch, bed, stool, chair). */
    sitAt(id: string, pose?: 'sit' | 'type'): void;
    /** Stand back up from a seat. */
    standUp(): void;
    /** Fade the world to black (1) or back in (0) — used for sleeping. */
    setFade(amount: number): void;
    /** Player position in 0..1 room space, for the minimap. */
    getMapPosition(): { x: number; z: number };
    /** Continuous movement input from the on-screen stick, -1..1 each axis. */
    setStick(x: number, y: number): void;
    projectLabels(ids: string[]): LabelSpot[];
    dispose(): void;
}

/** ~37 degree look-down, rotated 45 degrees: classic diorama isometric. */
const ISO_DIR = new THREE.Vector3(1, 1.18, 1.25).normalize();
const CAM_DIST = 46;
/** How close the player must be for an interaction to be offered. */
const REACH = 2.3;

export function createWorld(host: HTMLElement, opts: WorldOptions): WorldHandle {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bg = new THREE.Color(0x111a2c);
    scene.background = bg.clone();
    // Fog starts well beyond the far buildings so skylines stay visible.
    scene.fog = new THREE.Fog(bg.clone(), 60, 120);

    const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.5, 220);
    const camTarget = new THREE.Vector3(0, -2.4, 0);
    const camDesired = new THREE.Vector3();
    const sceneCenter = new THREE.Vector3(0, 0, -0.3);
    let verticalShift = -2.4;

    const placeCamera = () => {
        camera.position.copy(camTarget).addScaledVector(ISO_DIR, CAM_DIST);
        camera.lookAt(camTarget);
    };
    placeCamera();

    const hemi = new THREE.HemisphereLight(0xbcd4ff, 0x2a2733, 0.6);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.34);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe6c4, 1.7);
    sun.position.set(10, 16, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 70;
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 13;
    sun.shadow.camera.bottom = -13;
    sun.shadow.bias = -0.0009;
    scene.add(sun);
    const sunAnchor = new THREE.Object3D();
    scene.add(sunAnchor);
    sun.target = sunAnchor;
    const fill = new THREE.DirectionalLight(0x93b4ff, 0.4);
    fill.position.set(-9, 8, -6);
    scene.add(fill);

    const OFF = OFFSETS;
    const rooms: Record<SceneId, Diorama> = {
        studio: createStudio(OFF.studio),
        home: createApartment(OFF.home),
        bar: createBar(OFF.bar),
        family: createFamilyHouse(OFF.family),
        publisher: createPublisher(OFF.publisher),
        rooftop: createRooftop(OFF.rooftop),
        clinic: createClinic(OFF.clinic),
        hospital: createHospital(OFF.hospital),
    };
    for (const room of Object.values(rooms)) scene.add(room.group);

    // ---- Navigation: one grid per location, all in world coordinates -----
    const H = OFF.home;
    const B = OFF.bar;
    const F = OFF.family;
    const P = OFF.publisher;
    const R = OFF.rooftop;
    const C = OFF.clinic;
    const W = OFF.hospital;

    const navs: Record<SceneId, NavGrid> = {
        studio: createNavGrid({
            bounds: { minX: -6.2, maxX: 6.2, minZ: -4.7, maxZ: 4.7 },
            blocked: [
                { minX: -4.8, maxX: -2.4, minZ: -4.3, maxZ: -2.85 },
                { minX: -0.7, maxX: 1.4, minZ: -4.3, maxZ: -3.05 },
                { minX: 1.5, maxX: 2.6, minZ: -3.8, maxZ: -2.7 },
                { minX: -6.4, maxX: -4.5, minZ: -1.6, maxZ: -0.35 },
                { minX: -3.6, maxX: -1.7, minZ: -1.6, maxZ: -0.35 },
                { minX: 3.0, maxX: 5.6, minZ: -5.0, maxZ: -3.7 },
                { minX: 1.5, maxX: 3.2, minZ: -5.6, maxZ: -4.9 },
                { minX: 1.1, maxX: 4.0, minZ: -1.85, maxZ: -1.35 },
                { minX: 4.9, maxX: 6.8, minZ: -1.85, maxZ: -1.35 },
                { minX: 1.1, maxX: 1.5, minZ: -5.7, maxZ: -1.35 },
                { minX: 5.9, maxX: 6.9, minZ: -2.9, maxZ: -1.7 },
                { minX: 4.3, maxX: 6.5, minZ: 3.2, maxZ: 4.2 },
                { minX: 2.5, maxX: 4.3, minZ: 3.8, maxZ: 4.8 },
                { minX: 5.5, maxX: 6.9, minZ: 0.1, maxZ: 2.3 },
                { minX: 6.2, maxX: 6.9, minZ: 4.4, maxZ: 5.0 },
                { minX: -5.2, maxX: -4.0, minZ: 2.4, maxZ: 3.4 },
                { minX: -6.7, maxX: -5.8, minZ: 0.8, maxZ: 3.2 },
                { minX: -6.8, maxX: -4.8, minZ: 4.1, maxZ: 5.0 },
                { minX: -6.8, maxX: -5.8, minZ: -5.1, maxZ: -4.2 },
                { minX: -2.3, maxX: -1.5, minZ: 4.5, maxZ: 5.0 },
                { minX: 1.0, maxX: 1.8, minZ: 4.2, maxZ: 5.0 },
                { minX: -0.3, maxX: 0.7, minZ: 4.3, maxZ: 5.0 },
            ],
        }),
        home: createNavGrid({
            bounds: { minX: H - 4.3, maxX: H + 4.3, minZ: -3.8, maxZ: 3.8 },
            blocked: [
                { minX: H - 3.7, maxX: H - 1.5, minZ: -4.1, maxZ: -2.95 },
                { minX: H - 2.1, maxX: H - 0.9, minZ: -4.5, maxZ: -3.9 },
                { minX: H + 1.5, maxX: H + 4.4, minZ: -3.3, maxZ: -0.1 },
                { minX: H + 3.8, maxX: H + 4.9, minZ: -4.4, maxZ: -3.4 },
                { minX: H - 3.8, maxX: H - 1.0, minZ: 2.1, maxZ: 3.3 },
                { minX: H - 3.2, maxX: H - 1.6, minZ: 1.0, maxZ: 1.7 },
                { minX: H + 1.5, maxX: H + 4.5, minZ: 2.8, maxZ: 3.9 },
                { minX: H - 4.9, maxX: H - 4.0, minZ: 0.6, maxZ: 2.6 },
                { minX: H - 4.9, maxX: H - 4.1, minZ: -2.0, maxZ: -0.2 },
                { minX: H + 3.9, maxX: H + 4.9, minZ: 0.4, maxZ: 2.6 },
            ],
        }),
        bar: createNavGrid({
            bounds: { minX: B - 4.8, maxX: B + 4.8, minZ: -3.9, maxZ: 4.2 },
            blocked: [
                { minX: B - 0.2, maxX: B + 5.4, minZ: -4.0, maxZ: -2.7 },   // bar counter
                { minX: B + 0.3, maxX: B + 4.5, minZ: -2.8, maxZ: -2.2 },   // stools
                { minX: B - 5.4, maxX: B - 3.4, minZ: -3.5, maxZ: -1.7 },   // booth 1
                { minX: B - 5.4, maxX: B - 3.4, minZ: -1.5, maxZ: 0.3 },    // booth 2
                { minX: B - 5.4, maxX: B - 3.4, minZ: 0.5, maxZ: 2.3 },     // booth 3
                { minX: B - 3.6, maxX: B - 2.6, minZ: -3.1, maxZ: 1.9 },    // booth tables
                { minX: B + 4.2, maxX: B + 5.2, minZ: 0.0, maxZ: 0.8 },     // jukebox
                { minX: B + 1.6, maxX: B + 4.4, minZ: 2.4, maxZ: 4.0 },     // pool table
                { minX: B - 5.5, maxX: B - 4.6, minZ: 3.1, maxZ: 4.1 },     // cabinet
                { minX: B + 4.6, maxX: B + 5.6, minZ: 3.9, maxZ: 4.9 },     // plant
                { minX: B - 1.5, maxX: B - 0.5, minZ: -4.6, maxZ: -3.9 },   // shelves
                { minX: B - 0.7, maxX: B + 0.3, minZ: 1.9, maxZ: 2.9 },     // plant
                { minX: B + 4.7, maxX: B + 5.7, minZ: -1.5, maxZ: -0.3 },   // cabinet
                { minX: B - 0.7, maxX: B + 0.2, minZ: 4.1, maxZ: 4.9 },     // umbrella stand
            ],
        }),
        family: createNavGrid({
            bounds: { minX: F - 5.0, maxX: F + 5.0, minZ: -4.1, maxZ: 4.3 },
            blocked: [
                { minX: F - 0.3, maxX: F + 3.1, minZ: -2.9, maxZ: -1.1 },   // dinner table
                { minX: F - 0.2, maxX: F + 3.0, minZ: -3.4, maxZ: -2.9 },   // far chairs
                { minX: F - 0.2, maxX: F + 3.0, minZ: -1.1, maxZ: -0.6 },   // near chairs
                { minX: F - 4.0, maxX: F - 1.2, minZ: 1.9, maxZ: 3.1 },     // sofa
                { minX: F - 5.4, maxX: F - 3.8, minZ: -0.4, maxZ: 1.6 },    // second sofa
                { minX: F - 3.4, maxX: F - 1.8, minZ: 0.5, maxZ: 1.5 },     // coffee table
                { minX: F - 5.8, maxX: F - 4.9, minZ: -2.8, maxZ: -0.4 },   // fireplace
                { minX: F + 2.2, maxX: F + 5.8, minZ: 0.4, maxZ: 1.6 },     // kitchen counter
                { minX: F + 4.8, maxX: F + 5.8, minZ: -1.1, maxZ: 0.2 },    // fridge
                { minX: F - 1.1, maxX: F + 0.7, minZ: 3.6, maxZ: 4.6 },     // TV unit
                { minX: F - 4.9, maxX: F - 3.5, minZ: 4.0, maxZ: 4.8 },     // shelves
                { minX: F + 4.6, maxX: F + 5.8, minZ: 3.1, maxZ: 4.1 },     // plant
            ],
        }),
        publisher: createNavGrid({
            bounds: { minX: P - 5.4, maxX: P + 5.4, minZ: -3.9, maxZ: 4.3 },
            blocked: [
                { minX: P - 3.0, maxX: P + 3.0, minZ: -2.2, maxZ: -0.2 },   // review table
                { minX: P - 2.6, maxX: P + 2.4, minZ: -2.9, maxZ: -2.2 },   // their chairs
                { minX: P - 2.6, maxX: P + 2.4, minZ: -0.2, maxZ: 0.5 },    // your chairs
                { minX: P - 6.1, maxX: P - 5.4, minZ: -3.2, maxZ: 2.2 },    // screen wall
                { minX: P - 5.0, maxX: P - 1.8, minZ: 2.8, maxZ: 3.7 },     // reception desk
                { minX: P + 0.3, maxX: P + 3.0, minZ: 2.9, maxZ: 4.0 },     // sofa
                { minX: P + 3.7, maxX: P + 5.6, minZ: 1.2, maxZ: 3.2 },     // second sofa
                { minX: P + 1.0, maxX: P + 2.3, minZ: 1.7, maxZ: 2.5 },     // low table
                { minX: P - 0.8, maxX: P - 0.4, minZ: 1.3, maxZ: 4.7 },     // glass partition
                { minX: P + 2.2, maxX: P + 3.8, minZ: -4.7, maxZ: -3.9 },   // awards shelf
                { minX: P + 4.7, maxX: P + 6.0, minZ: 3.6, maxZ: 4.8 },     // plant
                { minX: P - 6.0, maxX: P - 4.9, minZ: 1.4, maxZ: 2.6 },     // plant
            ],
        }),
        rooftop: createNavGrid({
            bounds: { minX: R - 4.9, maxX: R + 4.9, minZ: -4.2, maxZ: 4.2 },
            blocked: [
                { minX: R + 1.9, maxX: R + 4.9, minZ: -3.8, maxZ: -2.2 },   // aircon block
                { minX: R + 4.4, maxX: R + 5.5, minZ: -1.8, maxZ: -0.6 },   // vent unit
                { minX: R - 5.0, maxX: R - 3.8, minZ: -4.5, maxZ: 0.1 },    // duct run
                { minX: R + 1.2, maxX: R + 2.0, minZ: -4.4, maxZ: -3.6 },   // stack
                { minX: R - 1.4, maxX: R - 0.6, minZ: -4.5, maxZ: -3.7 },   // stack
                { minX: R + 2.0, maxX: R + 2.8, minZ: 2.2, maxZ: 3.0 },     // stack
                { minX: R + 4.5, maxX: R + 5.5, minZ: 1.9, maxZ: 2.9 },     // dish
                { minX: R + 3.0, maxX: R + 5.4, minZ: 2.5, maxZ: 4.7 },     // head-house
                { minX: R - 4.0, maxX: R - 2.8, minZ: 1.3, maxZ: 2.3 },     // bench
                { minX: R - 1.6, maxX: R - 0.8, minZ: 2.0, maxZ: 2.8 },     // crate
                { minX: R - 0.8, maxX: R - 0.1, minZ: 2.9, maxZ: 3.6 },     // crate
                { minX: R + 1.2, maxX: R + 2.2, minZ: 0.4, maxZ: 1.4 },     // table + chairs
                { minX: R - 5.5, maxX: R - 4.5, minZ: 3.1, maxZ: 4.1 },     // buckets
                { minX: R - 4.7, maxX: R - 3.7, minZ: 3.5, maxZ: 4.5 },     // buckets
                { minX: R + 0.1, maxX: R + 1.1, minZ: 3.7, maxZ: 4.6 },     // bucket
                { minX: R - 5.5, maxX: R - 4.5, minZ: -0.7, maxZ: 0.3 },    // shelf
            ],
        }),
        clinic: createNavGrid({
            bounds: { minX: C - 4.9, maxX: C + 4.9, minZ: -3.6, maxZ: 3.9 },
            blocked: [
                { minX: C - 5.0, maxX: C - 1.4, minZ: -3.6, maxZ: -2.5 },   // reception desk
                { minX: C - 4.2, maxX: C + 0.9, minZ: 0.9, maxZ: 1.8 },     // chair row 1
                { minX: C - 4.2, maxX: C + 0.9, minZ: 2.4, maxZ: 3.3 },     // chair row 2
                { minX: C + 1.1, maxX: C + 2.5, minZ: 1.6, maxZ: 2.5 },     // low table
                { minX: C + 3.3, maxX: C + 5.1, minZ: 1.7, maxZ: 3.6 },     // sofa
                { minX: C + 4.5, maxX: C + 5.5, minZ: 0.1, maxZ: 1.2 },     // plant
                { minX: C - 5.5, maxX: C - 4.5, minZ: 2.9, maxZ: 3.9 },     // plant
                { minX: C + 4.5, maxX: C + 5.5, minZ: 3.3, maxZ: 4.3 },     // cooler
                { minX: C + 1.0, maxX: C + 1.5, minZ: -4.2, maxZ: -0.7 },   // curtain rail
                { minX: C + 1.1, maxX: C + 5.0, minZ: -1.0, maxZ: -0.5 },   // curtain rail
                { minX: C + 3.7, maxX: C + 5.0, minZ: -3.5, maxZ: -1.3 },   // exam bed
                { minX: C + 1.4, maxX: C + 3.5, minZ: -4.0, maxZ: -2.9 },   // doctor desk
                { minX: C - 1.0, maxX: C - 0.2, minZ: 3.5, maxZ: 4.2 },     // bin
            ],
        }),
        hospital: createNavGrid({
            bounds: { minX: W - 4.9, maxX: W + 4.9, minZ: -3.8, maxZ: 3.9 },
            blocked: [
                // The four bed bays.
                { minX: W - 4.3, maxX: W - 3.0, minZ: -3.0, maxZ: -0.5 },
                { minX: W - 1.8, maxX: W - 0.5, minZ: -3.0, maxZ: -0.5 },
                { minX: W + 1.9, maxX: W + 3.3, minZ: -3.0, maxZ: -0.5 },
                { minX: W + 4.2, maxX: W + 5.5, minZ: -3.0, maxZ: -0.5 },
                // Bedside cabinets and visitor chairs.
                { minX: W - 3.0, maxX: W - 2.4, minZ: -2.7, maxZ: -2.1 },
                { minX: W - 0.5, maxX: W + 0.1, minZ: -2.7, maxZ: -2.1 },
                { minX: W + 3.2, maxX: W + 3.8, minZ: -2.7, maxZ: -2.1 },
                // Nurses' station.
                { minX: W - 4.5, maxX: W - 1.5, minZ: -3.9, maxZ: -2.9 },
                // Waiting sofa and low table.
                { minX: W - 4.5, maxX: W - 2.3, minZ: 2.1, maxZ: 3.1 },
                { minX: W - 3.9, maxX: W - 2.9, minZ: 1.2, maxZ: 1.8 },
                // Vending machine, gel post, plant.
                { minX: W - 5.5, maxX: W - 4.5, minZ: 3.6, maxZ: 4.4 },
                { minX: W - 2.1, maxX: W - 1.5, minZ: 3.7, maxZ: 4.3 },
                { minX: W + 4.3, maxX: W + 5.3, minZ: 3.1, maxZ: 4.1 },
            ],
        }),
    };

    // ---- Cast -------------------------------------------------------------
    const player = createRig({ skin: 0xd8a882, hair: 0x2b2320, shirt: 0x4b7f9d, trousers: 0x333a45 });
    player.group.position.copy(LOCATIONS.studio.playerStart);
    player.setYaw(Math.PI);
    scene.add(player.group);

    /** Places a character can stand, per location. */
    const place = (rig: Rig, id: string, yaw: number, pose: Parameters<Rig['setPose']>[0]) => {
        const entry = ANCHORS[id];
        if (entry) rig.group.position.copy(entry.anchor.at);
        rig.setYaw(yaw);
        rig.setPose(pose);
        scene.add(rig.group);
    };

    // Work sphere.
    const mara = createRig({ skin: 0xc98d68, hair: 0x37241d, shirt: 0x8f4a52, trousers: 0x2b2b33, height: 1.02 });
    place(mara, 'mara', Math.PI * 0.9, 'review');
    const jonah = createRig({ skin: 0xe0b591, hair: 0x8a6a3c, shirt: 0x5f6f52, trousers: 0x3a3f4a, height: 1.04 });
    place(jonah, 'jonah', Math.PI, 'type');
    const theo = createRig({ skin: 0xb87f5e, hair: 0x1f1b19, shirt: 0xc9a24a, trousers: 0x3f4450, height: 0.96 });
    place(theo, 'theo', Math.PI * 0.4, 'shift');
    const nadia = createRig({ skin: 0xb57855, hair: 0x1f1a18, shirt: 0x2e8b8b, trousers: 0x2e3540, height: 0.98 });
    place(nadia, 'nadia', Math.PI * 0.9, 'type');
    const tara = createRig({ skin: 0xa9714f, hair: 0x241c19, shirt: 0x9e3852, trousers: 0x22262f, height: 1.01 });
    place(tara, 'tara', -Math.PI * 0.4, 'review');

    // Personal sphere.
    const priya = createRig({ skin: 0xa9714f, hair: 0x241c19, shirt: 0x9a4f7a, trousers: 0x2f3440, height: 0.99 });
    place(priya, 'bar_priya', Math.PI * 0.5, 'idle');
    const mum = createRig({ skin: 0xe6c1a0, hair: 0x8f8f96, shirt: 0x7a5f8a, trousers: 0x4a4450, height: 0.97 });
    place(mum, 'family_mum', 0, 'idle');
    const sister = createRig({ skin: 0xd9a87f, hair: 0x40281f, shirt: 0x5f8a7a, trousers: 0x3a3f4a, height: 1.0 });
    place(sister, 'family_sister', Math.PI * 0.15, 'idle');

    // The publisher's side of the table.
    const exec = createRig({ skin: 0xefcfae, hair: 0x6a6a70, shirt: 0x35405a, trousers: 0x22262f, height: 1.05 });
    place(exec, 'pub_exec', 0, 'idle');
    // Mara attends the review too — a second body for her at the publisher.
    const maraPub = createRig({ skin: 0xc98d68, hair: 0x37241d, shirt: 0x8f4a52, trousers: 0x2b2b33, height: 1.02 });
    place(maraPub, 'pub_mara', Math.PI, 'idle');

    // Episode 3: the ward. Your dad is in bed (so he is posed sitting), your mum
    // has not left the chair beside him, and a night nurse works the station.
    const dad = createRig({ skin: 0xd9b48f, hair: 0x8a8a90, shirt: 0xdce4e2, trousers: 0x7f9aa8, height: 1.02 });
    place(dad, 'ward_dad', -Math.PI / 2, 'sit');
    const mumWard = createRig({ skin: 0xe6c1a0, hair: 0x8f8f96, shirt: 0x7a5f8a, trousers: 0x4a4450, height: 0.97 });
    place(mumWard, 'ward_mum', Math.PI * 0.75, 'idle');
    const nurse = createRig({ skin: 0x8a5f42, hair: 0x1f1a17, shirt: 0x5f9aa8, trousers: 0x3f4a55, height: 1.0 });
    place(nurse, 'ward_nurse', Math.PI * 0.9, 'type');

    // Episode 2: the doctor at the clinic, and roof versions of the work cast so
    // Theo, Mara and Jonah can be met up there as well as at their desks.
    const doctor = createRig({ skin: 0x8a5f42, hair: 0x1f1a17, shirt: 0xdfe6ea, trousers: 0x3f4450, height: 1.0 });
    place(doctor, 'clinic_doctor', Math.PI * 0.8, 'idle');
    const theoRoof = createRig({ skin: 0xb87f5e, hair: 0x1f1b19, shirt: 0xc9a24a, trousers: 0x3f4450, height: 0.96 });
    place(theoRoof, 'roof_theo', Math.PI * 0.9, 'idle');
    const maraRoof = createRig({ skin: 0xc98d68, hair: 0x37241d, shirt: 0x8f4a52, trousers: 0x2b2b33, height: 1.02 });
    place(maraRoof, 'roof_mara', Math.PI * 1.1, 'idle');
    const jonahRoof = createRig({ skin: 0xe0b591, hair: 0x8a6a3c, shirt: 0x5f6f52, trousers: 0x3a3f4a, height: 1.04 });
    place(jonahRoof, 'roof_jonah', -Math.PI / 2, 'idle');

    // Background bodies so each room feels inhabited.
    const extras: { rig: Rig; scene: SceneId }[] = [];
    const addExtra = (
        look: Parameters<typeof createRig>[0],
        sceneId: SceneId,
        x: number,
        z: number,
        yaw: number,
        pose: Parameters<Rig['setPose']>[0]
    ) => {
        const rig = createRig(look);
        rig.group.position.set(OFF[sceneId] + x, 0, z);
        rig.setYaw(yaw);
        rig.setPose(pose);
        scene.add(rig.group);
        extras.push({ rig, scene: sceneId });
    };

    // Studio team.
    addExtra({ skin: 0xcf9a72, hair: 0x4a3428, shirt: 0x6b5f86, trousers: 0x363b45, height: 0.99 }, 'studio', -5.4, -0.1, Math.PI, 'type');
    addExtra({ skin: 0xefc39c, hair: 0x2d2a28, shirt: 0x4d7a72, trousers: 0x3a3f4a, height: 1.01 }, 'studio', -2.6, -0.1, Math.PI, 'type');
    // Bar regulars.
    addExtra({ skin: 0xc08a60, hair: 0x1f1a17, shirt: 0x4a5f7a, trousers: 0x2f3440, height: 1.03 }, 'bar', 1.6, -2.5, 0, 'sit');
    addExtra({ skin: 0xe8bd93, hair: 0x6a4a2c, shirt: 0x7a5f4a, trousers: 0x363b45, height: 0.98 }, 'bar', 3.4, -2.5, 0, 'sit');
    addExtra({ skin: 0xb07a56, hair: 0x2a2320, shirt: 0x5f7a5f, trousers: 0x3a3f4a, height: 1.02 }, 'bar', 1.9, 2.1, Math.PI * 0.8, 'idle');
    addExtra({ skin: 0xd8a87f, hair: 0x4a2f22, shirt: 0x8a5f7a, trousers: 0x2f3440, height: 0.97 }, 'bar', 4.2, 2.2, -Math.PI * 0.7, 'idle');
    // Bartender behind the counter.
    addExtra({ skin: 0xc48f66, hair: 0x1f1a17, shirt: 0x2f3a44, trousers: 0x22262f, height: 1.03 }, 'bar', 2.8, -3.75, 0, 'idle');
    // Priya's friends in the booths.
    addExtra({ skin: 0xefc39c, hair: 0x6a4a2c, shirt: 0x5f7a8a, trousers: 0x3a3f4a, height: 0.99 }, 'bar', -4.2, -2.6, Math.PI / 2, 'sit');
    addExtra({ skin: 0xa9714f, hair: 0x241c19, shirt: 0x7a6f4a, trousers: 0x2f3440, height: 1.0 }, 'bar', -4.2, 1.4, Math.PI / 2, 'sit');
    addExtra({ skin: 0xe8bd93, hair: 0x8a6a3c, shirt: 0x4a5f7a, trousers: 0x363b45, height: 1.01 }, 'bar', -2.1, 1.4, -Math.PI / 2, 'sit');
    // Family: your dad by the fire, plus a cousin at the table.
    addExtra({ skin: 0xd9b48f, hair: 0x8a8a90, shirt: 0x5f6b7a, trousers: 0x3f4450, height: 1.04 }, 'family', -3.9, -1.6, -Math.PI / 2, 'idle');
    addExtra({ skin: 0xc99a72, hair: 0x3a2a20, shirt: 0xa87f5f, trousers: 0x3a3f4a, height: 0.95 }, 'family', 0.3, -2.9, 0, 'sit');
    // Publisher: two more suits and a receptionist.
    addExtra({ skin: 0xe0b58f, hair: 0x4a3a2c, shirt: 0x3a4457, trousers: 0x22262f, height: 1.0 }, 'publisher', -0.65, -3.0, 0, 'sit');
    addExtra({ skin: 0xb98a68, hair: 0x241c19, shirt: 0x44506a, trousers: 0x22262f, height: 1.02 }, 'publisher', 2.0, -3.0, 0, 'sit');
    addExtra({ skin: 0xefcfae, hair: 0x5a4436, shirt: 0x50607a, trousers: 0x2f3440, height: 0.98 }, 'publisher', -3.4, 4.0, Math.PI, 'type');
    // Roof: a couple of other people escaping their desks.
    addExtra({ skin: 0xcf9a72, hair: 0x4a3428, shirt: 0x6b5f86, trousers: 0x363b45, height: 0.99 }, 'rooftop', -1.2, 2.85, Math.PI * 0.2, 'sit');
    addExtra({ skin: 0xe8bd93, hair: 0x2d2a28, shirt: 0x4d7a72, trousers: 0x3a3f4a, height: 1.01 }, 'rooftop', 1.5, -3.6, Math.PI, 'idle');
    // Clinic: a receptionist and two people waiting their turn.
    addExtra({ skin: 0xd9a87f, hair: 0x5a4436, shirt: 0x7aa8a0, trousers: 0x3f4450, height: 0.98 }, 'clinic', -3.2, -2.15, 0, 'type');
    addExtra({ skin: 0xb07a56, hair: 0x2a2320, shirt: 0x5f6b7a, trousers: 0x363b45, height: 1.02 }, 'clinic', -3.6, 1.05, 0, 'sit');
    addExtra({ skin: 0xefc39c, hair: 0x8a8a90, shirt: 0x8a6f5c, trousers: 0x4a4450, height: 0.96 }, 'clinic', 0.4, 2.55, 0, 'sit');
    // Ward: another patient sitting up, and someone waiting in the corridor.
    addExtra({ skin: 0xc08a60, hair: 0x6a6a70, shirt: 0xdce4e2, trousers: 0x7f9aa8, height: 1.0 }, 'hospital', -1.1, -1.7, -Math.PI / 2, 'sit');
    addExtra({ skin: 0xd8a87f, hair: 0x3a2a20, shirt: 0x5f6b7a, trousers: 0x363b45, height: 1.01 }, 'hospital', -3.4, 2.4, 0, 'sit');

    /** Story characters keyed for dialogue focus; per-location bodies. */
    const rigs: Record<string, Rig> = {
        player, mara, jonah, theo, nadia, tara, priya, mum, sister, exec, doctor,
        // Roof bodies are keyed so dialogue focus works up there too.
        theoRoof, maraRoof, jonahRoof,
        // Ward bodies.
        dad, mumWard, nurse,
    };
    /** Which location each story character belongs to. */
    const rigHome: Record<string, SceneId> = {
        mara: 'studio', jonah: 'studio', theo: 'studio', nadia: 'studio', tara: 'studio',
        priya: 'bar', mum: 'family', sister: 'family', exec: 'publisher',
        doctor: 'clinic', theoRoof: 'rooftop', maraRoof: 'rooftop', jonahRoof: 'rooftop',
        dad: 'hospital', mumWard: 'hospital', nurse: 'hospital',
    };
    const allRigs = [...Object.values(rigs), maraPub, ...extras.map((e) => e.rig)];

    /** Show only the bodies that belong in this room. */
    const applyCastVisibility = (s: SceneId) => {
        const beat = store.get().game.beat;
        const isEp3Plus = beat.startsWith('ep3_') || beat.startsWith('ep4_') || beat.startsWith('ep5_') || beat.startsWith('ep6_') || beat.startsWith('ep7_');
        const isEp4Plus = beat.startsWith('ep4_') || beat.startsWith('ep5_') || beat.startsWith('ep6_') || beat.startsWith('ep7_');
        for (const [key, rig] of Object.entries(rigs)) {
            if (key === 'player') continue;
            let visible = rigHome[key] === s;
            if (key === 'nadia') visible = visible && isEp3Plus;
            if (key === 'tara') visible = visible && isEp4Plus;
            rig.group.visible = visible;
        }
        maraPub.group.visible = s === 'publisher';
        for (const { rig, scene: home } of extras) rig.group.visible = home === s;
    };

    const blobGeo = new THREE.CircleGeometry(0.42, 18);
    const blobMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    const blobs: { blob: THREE.Mesh; rig: Rig }[] = [];
    for (const rig of allRigs) {
        const blob = new THREE.Mesh(blobGeo, blobMat);
        blob.rotation.x = -Math.PI / 2;
        blob.position.y = 0.014;
        scene.add(blob);
        blobs.push({ blob, rig });
    }

    // ---- Interaction hitboxes (invisible, raycast-only) --------------------
    const hitGeo = new THREE.SphereGeometry(0.95, 10, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitboxes: THREE.Mesh[] = [];
    for (const [id, entry] of Object.entries(ANCHORS)) {
        const mesh = new THREE.Mesh(hitGeo, hitMat);
        mesh.position.copy(entry.anchor.at);
        mesh.position.y = 0.95;
        mesh.userData.interactionId = id;
        mesh.userData.sceneId = entry.scene;
        scene.add(mesh);
        hitboxes.push(mesh);
    }

    // Highlight ring under the current interaction target.
    const ringGeo = new THREE.RingGeometry(0.55, 0.72, 26);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe6a765, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.visible = false;
    scene.add(ring);

    // ---- Movement ---------------------------------------------------------
    let path: THREE.Vector3[] = [];
    let pendingId: string | null = null;
    let faceOnArrive: THREE.Vector3 | null = null;
    let baseSpeed = 2.9;
    let activeScene: SceneId = 'studio';
    let focused: string | null = null;
    let walking = false;
    let nearest: string | null = null;
    let seated = false;
    let fade = 0;

    /**
     * Which room the player is physically standing in. This is derived from the
     * player's own position — NOT from story state — so the camera can never sit
     * on one room while the character is in another.
     */
    const roomAt = (x: number): SceneId => {
        let best: SceneId = 'studio';
        let bestDist = Infinity;
        for (const id of Object.keys(OFFSETS) as SceneId[]) {
            const d = Math.abs(OFFSETS[id] - x);
            if (d < bestDist) { bestDist = d; best = id; }
        }
        return best;
    };
    /** The room the player is in right now. */
    const playerRoom = (): SceneId => roomAt(player.group.position.x);

    const stick = new THREE.Vector2(0, 0);
    const keys = new Set<string>();

    const nav = () => navs[activeScene];

    const setWalking = (value: boolean) => {
        if (walking === value) return;
        walking = value;
        opts.onWalkChange(value);
    };

    const cancelAuto = () => {
        if (path.length > 0 || pendingId) {
            path = [];
            pendingId = null;
            faceOnArrive = null;
            setWalking(false);
        }
    };

    // ---- Input ------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pointer = new THREE.Vector2();
    const hit = new THREE.Vector3();

    const walkTo = (id: string) => {
        const entry = ANCHORS[id];
        if (!entry) return;
        seated = false;

        // If the target is in a DIFFERENT room (the roof, the clinic), the
        // player travels there first and then walks the last few steps. Without
        // this, pathfinding was asked to cross 24 units of empty space between
        // dioramas, so the character never moved and the camera stayed behind.
        if (entry.scene !== playerRoom()) {
            player.group.position.copy(LOCATIONS[entry.scene].playerStart);
            player.setYaw(Math.PI);
            activeScene = entry.scene;
            sceneCenter.set(OFF[entry.scene], 0, -0.3);
            applyCastVisibility(entry.scene);
            camTarget.set(player.group.position.x, verticalShift, player.group.position.z);
            placeCamera();
            opts.onRoomChanged?.(entry.scene);
        }

        const grid = navs[entry.scene];
        path = grid.findPath(player.group.position, entry.anchor.approach.clone());
        pendingId = id;
        faceOnArrive = entry.anchor.at.clone();
        setWalking(true);
    };

    const onPointerDown = (event: PointerEvent) => {
        if (opts.isBlocked()) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        // A tap on a live person/prop walks over and starts the interaction.
        const active = opts.getActive();
        const targets = hitboxes.filter(
            (m) => m.userData.sceneId === activeScene && active.includes(m.userData.interactionId as string)
        );
        const picked = raycaster.intersectObjects(targets, false);
        if (picked.length > 0) {
            walkTo(picked[0].object.userData.interactionId as string);
            return;
        }

        // Otherwise walk to the tapped floor point.
        if (!raycaster.ray.intersectPlane(floorPlane, hit)) return;
        const grid = nav();
        const target = grid.walkable(hit.x, hit.z)
            ? new THREE.Vector3(hit.x, 0, hit.z)
            : grid.clamp(hit.x, hit.z);
        path = grid.findPath(player.group.position, target);
        pendingId = null;
        faceOnArrive = null;
        setWalking(path.length > 0);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const MOVE_KEYS = new Set([
        'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
    ]);
    const onKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (!MOVE_KEYS.has(key)) return;
        event.preventDefault();
        keys.add(key);
    };
    const onKeyUp = (event: KeyboardEvent) => {
        keys.delete(event.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ---- Loop -------------------------------------------------------------
    // Full-screen fade quad, used for sleeping and scene transitions.
    const fadeScene = new THREE.Scene();
    const fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fadeGeo = new THREE.PlaneGeometry(2, 2);
    const fadeMat = new THREE.MeshBasicMaterial({ color: 0x04060b, transparent: true, opacity: 0 });
    fadeScene.add(new THREE.Mesh(fadeGeo, fadeMat));

    const clock = new THREE.Clock();
    let raf = 0;
    const stepGoal = new THREE.Vector3();
    const moveDir = new THREE.Vector2();
    const facePoint = new THREE.Vector3();

    const tick = () => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(0.05, clock.getDelta());
        const blocked = opts.isBlocked();

        // --- Free movement (stick + keys), isometric-corrected ---
        moveDir.set(0, 0);
        if (!blocked && !seated) {
            if (keys.has('a') || keys.has('arrowleft')) moveDir.x -= 1;
            if (keys.has('d') || keys.has('arrowright')) moveDir.x += 1;
            if (keys.has('w') || keys.has('arrowup')) moveDir.y -= 1;
            if (keys.has('s') || keys.has('arrowdown')) moveDir.y += 1;
            moveDir.x += stick.x;
            moveDir.y += stick.y;
        }

        if (moveDir.lengthSq() > 0.02) {
            cancelAuto();
            moveDir.normalize();
            // Screen-up should walk "into" the room (camera looks from the
            // +x/+z corner): screen-up = world (-x,-z), screen-right =
            // world (+x,-z). The rotation below maps input accordingly.
            const cos = Math.SQRT1_2;
            const wx = (moveDir.x + moveDir.y) * cos;
            const wz = (moveDir.y - moveDir.x) * cos;
            const grid = nav();
            const step = baseSpeed * dt;
            const nx = player.group.position.x + wx * step;
            const nz = player.group.position.z + wz * step;
            // Slide along walls instead of sticking to them.
            if (grid.walkable(nx, nz)) {
                player.group.position.set(nx, 0, nz);
            } else if (grid.walkable(nx, player.group.position.z)) {
                player.group.position.x = nx;
            } else if (grid.walkable(player.group.position.x, nz)) {
                player.group.position.z = nz;
            }
            player.setPose('walk');
            facePoint.set(player.group.position.x + wx, 0, player.group.position.z + wz);
            player.faceTowards(facePoint);
            setWalking(false); // manual movement never blocks the UI
        } else if (path.length > 0) {
            player.setPose('walk');
            const next = path[0];
            const dx = next.x - player.group.position.x;
            const dz = next.z - player.group.position.z;
            const dist = Math.hypot(dx, dz);
            if (dist < 0.12) {
                path.shift();
                if (path.length === 0) {
                    player.setPose('idle');
                    if (faceOnArrive) player.faceTowards(faceOnArrive);
                    const id = pendingId;
                    pendingId = null;
                    faceOnArrive = null;
                    setWalking(false);
                    if (id) opts.onInteract(id);
                }
            } else {
                const step = Math.min(dist, baseSpeed * dt);
                stepGoal.set(
                    player.group.position.x + (dx / dist) * step,
                    0,
                    player.group.position.z + (dz / dist) * step
                );
                player.group.position.lerp(stepGoal, 0.75);
                player.faceTowards(next);
            }
        } else if (player.getPose() === 'walk') {
            player.setPose('idle');
        }

        for (const rig of allRigs) rig.update(dt);
        for (const [key, rig] of Object.entries(rigs)) {
            if (key !== 'player' && focused === key) rig.faceTowards(player.group.position);
        }

        for (const { blob, rig } of blobs) {
            blob.position.x = rig.group.position.x;
            blob.position.z = rig.group.position.z;
            blob.visible = rig.group.visible;
        }

        // --- The room follows the PLAYER, not the story ---
        // If the character has ended up in a different room (walked there, was
        // seated there, or the story teleported them), the camera and the cast
        // follow immediately. This is what was broken: the camera used to stay
        // wherever the story said, so it sat on the office while you were on
        // the roof.
        const standingIn = playerRoom();
        if (standingIn !== activeScene) {
            activeScene = standingIn;
            sceneCenter.set(OFF[standingIn], 0, -0.3);
            applyCastVisibility(standingIn);
            opts.onRoomChanged?.(standingIn);
        }

        // --- Nearest interaction within reach (drives the action button) ---
        if (!blocked) {
            const active = opts.getActive();
            let bestId: string | null = null;
            let bestDist = REACH;
            for (const id of active) {
                const entry = ANCHORS[id];
                if (!entry || entry.scene !== activeScene) continue;
                const d = Math.hypot(
                    entry.anchor.at.x - player.group.position.x,
                    entry.anchor.at.z - player.group.position.z
                );
                if (d < bestDist) { bestDist = d; bestId = id; }
            }
            if (bestId !== nearest) {
                nearest = bestId;
                opts.onNearestChange(bestId);
            }
            if (nearest) {
                const entry = ANCHORS[nearest];
                ring.position.set(entry.anchor.at.x, 0.02, entry.anchor.at.z);
                ring.visible = true;
                ringMat.opacity = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.18;
            } else {
                ring.visible = false;
            }
        } else if (nearest !== null) {
            nearest = null;
            ring.visible = false;
            opts.onNearestChange(null);
        }

        // Camera locks onto the character every single frame, clamped only so it
        // does not show the void outside the room the character is standing in.
        const bounds = ROOM_BOUNDS[activeScene];
        const marginX = Math.min(2.2, (bounds.maxX - bounds.minX) * 0.18);
        const marginZ = Math.min(2.0, (bounds.maxZ - bounds.minZ) * 0.18);
        camDesired.set(
            Math.max(bounds.minX + marginX, Math.min(bounds.maxX - marginX, player.group.position.x)),
            verticalShift,
            Math.max(bounds.minZ + marginZ, Math.min(bounds.maxZ - marginZ, player.group.position.z))
        );
        // A long hop between rooms snaps rather than sliding across empty space.
        const gap = camTarget.distanceTo(camDesired);
        camTarget.lerp(camDesired, gap > 10 ? 1 : Math.min(1, dt * 6));
        placeCamera();
        sunAnchor.position.set(camTarget.x, 0, camTarget.z);
        sun.position.set(camTarget.x + 10, 16, camTarget.z + 9);

        renderer.render(scene, camera);
        if (fade > 0.001) {
            fadeMat.opacity = fade;
            renderer.autoClear = false;
            renderer.render(fadeScene, fadeCam);
            renderer.autoClear = true;
        }
    };

    const applyFrustum = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        const aspect = w / h;
        let halfW: number;
        let halfH: number;
        if (aspect < 1) {
            halfW = 5.6;
            halfH = halfW / aspect;
            verticalShift = -Math.min(4.4, halfH * 0.26);
        } else {
            halfH = 6.2;
            halfW = halfH * aspect;
            verticalShift = -0.6;
        }
        camera.left = -halfW;
        camera.right = halfW;
        camera.top = halfH;
        camera.bottom = -halfH;
        camera.updateProjectionMatrix();
    };

    const resize = () => {
        renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
        applyFrustum();
    };
    /**
     * Asset loading, entirely in the background. The world is already playable
     * from boxes; models upgrade it as they arrive.
     */
    let dressing: THREE.Group | null = null;
    let disposed = false;
    void (async () => {
        try {
            await preloadCritical();
            if (disposed) return;
            dressing = dressRooms(scene);
            preloadDeferred();

            // Re-dress as late arrivals land, so a slow CDN does not leave a
            // room half-furnished.
            for (const delay of [2500, 6000]) {
                setTimeout(() => {
                    if (disposed) return;
                    if (dressing) scene.remove(dressing);
                    dressing = dressRooms(scene);
                }, delay);
            }
        } catch {
            /* the procedural world stands on its own */
        }
    })();

    resize();
    // Start on the player, wherever they are.
    activeScene = playerRoom();
    sceneCenter.set(OFF[activeScene], 0, -0.3);
    applyCastVisibility(activeScene);
    camTarget.set(player.group.position.x, verticalShift, player.group.position.z);
    placeCamera();
    tick();

    const projectVector = new THREE.Vector3();

    return {
        resize,
        goTo(id) { walkTo(id); },
        setScene(s, instant = false) {
            // The player is MOVED into the room. The camera then follows them,
            // rather than the camera being moved and the player left behind.
            const alreadyThere = playerRoom() === s;
            if (!instant && alreadyThere) return;
            seated = false;
            player.group.position.copy(LOCATIONS[s].playerStart);
            player.setYaw(Math.PI);
            path = [];
            pendingId = null;
            faceOnArrive = null;
            setWalking(false);
            player.setPose('idle');
            nearest = null;
            opts.onNearestChange(null);
            // Snap the camera onto them right away.
            activeScene = s;
            sceneCenter.set(OFF[s], 0, -0.3);
            applyCastVisibility(s);
            camTarget.set(player.group.position.x, verticalShift, player.group.position.z);
            placeCamera();
        },
        setMood(night, burnout) {
            for (const room of Object.values(rooms)) {
                room.setMood({ night, burnout });
                room.setClutter(burnout);
            }
            sun.intensity = 1.8 - night * 1.45;
            sun.color.setHex(0xffe6c4).lerp(new THREE.Color(0x9fb6ff), night);
            hemi.intensity = 0.6 - night * 0.34;
            hemi.color.setHex(0xbcd4ff).lerp(new THREE.Color(0x584d78), night);
            ambient.intensity = 0.34 - night * 0.16;
            fill.intensity = 0.4 - night * 0.18;
            const target = new THREE.Color(0x111a2c).lerp(new THREE.Color(0x05070d), night);
            (scene.background as THREE.Color).copy(target);
            (scene.fog as THREE.Fog).color.copy(target);
            renderer.toneMappingExposure = 1.05 - night * 0.1;
            const drag = Math.max(0, Math.min(1, (burnout - 40) / 60));
            baseSpeed = 2.9 - drag * 1.05;
            player.setSpeedScale(1 - drag * 0.35);
        },
        setPromoted(on) { rooms.studio.setPromoted(on); },
        setKeptPromise(on) { rooms.family.setPromoted(on); },
        setCast(s) { applyCastVisibility(s); },
        focusOn(who) {
            focused = who && rigs[who] ? who : null;
            if (focused) {
                player.faceTowards(rigs[focused].group.position);
                if (rigs[focused].getPose() === 'shift') rigs[focused].setPose('idle');
            }
        },
        setPlayerPose(pose) {
            if (path.length === 0) player.setPose(pose);
        },
        sitAt(id, pose = 'sit') {
            const seat = SEATS[id];
            if (!seat) { player.setPose(pose); return; }
            path = [];
            pendingId = null;
            faceOnArrive = null;
            setWalking(false);
            // Seating can legitimately move the player to another room (the roof
            // bench, the clinic chairs). The camera picks that up next frame.
            player.group.position.set(seat.x, 0, seat.z);
            player.setYaw(seat.yaw);
            player.setPose(pose);
            seated = true;
        },
        standUp() {
            if (!seated) return;
            seated = false;
            player.setPose('idle');
        },
        setFade(amount) {
            fade = Math.max(0, Math.min(1, amount));
        },
        getMapPosition() {
            const b = ROOM_BOUNDS[activeScene];
            return {
                x: Math.max(0, Math.min(1, (player.group.position.x - b.minX) / (b.maxX - b.minX))),
                z: Math.max(0, Math.min(1, (player.group.position.z - b.minZ) / (b.maxZ - b.minZ))),
            };
        },
        setStick(x, y) {
            stick.set(x, y);
        },
        projectLabels(ids) {
            const rect = renderer.domElement.getBoundingClientRect();
            const spots: LabelSpot[] = [];
            for (const id of ids) {
                const entry = ANCHORS[id];
                if (!entry || entry.scene !== activeScene) continue;
                projectVector.copy(entry.anchor.at);
                projectVector.y += entry.labelHeight;
                projectVector.project(camera);
                const x = (projectVector.x * 0.5 + 0.5) * rect.width;
                const y = (-projectVector.y * 0.5 + 0.5) * rect.height;
                spots.push({
                    id,
                    x,
                    y,
                    // Keep labels clear of the header, objective bar and controls.
                    visible: x > 14 && x < rect.width - 14 && y > rect.height * 0.24 && y < rect.height - 170,
                });
            }
            return spots;
        },
        dispose() {
            disposed = true;
            cancelAnimationFrame(raf);
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            for (const rig of allRigs) rig.dispose();
            blobGeo.dispose();
            blobMat.dispose();
            hitGeo.dispose();
            hitMat.dispose();
            ringGeo.dispose();
            ringMat.dispose();
            fadeGeo.dispose();
            fadeMat.dispose();
            for (const room of Object.values(rooms)) room.dispose();
            disposeDioramaPools();
            disposeModels();
            renderer.dispose();
            if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
        },
    };
}
