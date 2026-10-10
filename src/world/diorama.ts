/**
 * Procedural dioramas: the Northlight studio and the home apartment, dressed
 * with furniture, props and practical lights, plus the dynamic dressing that
 * reacts to state (burnout clutter, the promoted desk).
 */
import * as THREE from 'three';

export interface Diorama {
    group: THREE.Group;
    setMood(opts: { night: number; burnout: number }): void;
    setPromoted(on: boolean): void;
    setClutter(level: number): void;
    dispose(): void;
}

const geoms: THREE.BufferGeometry[] = [];
const mats: THREE.Material[] = [];

export function track<T extends THREE.BufferGeometry>(g: T): T { geoms.push(g); return g; }
export function trackMat<T extends THREE.Material>(m: T): T { mats.push(m); return m; }

export function solid(color: number, roughness = 0.85, metalness = 0.05) {
    return trackMat(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
}
export function glow(color: number, intensity = 1) {
    return trackMat(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.45 }));
}

export function block(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export function flat(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) {
    const mesh = block(w, h, d, mat, x, y, z);
    mesh.castShadow = false;
    return mesh;
}

export function desk(top: THREE.Material, leg: THREE.Material, x: number, z: number, w = 1.9, d = 1.0, yaw = 0) {
    const g = new THREE.Group();
    g.add(block(w, 0.08, d, top, 0, 0.74, 0));
    const lx = w / 2 - 0.1;
    const lz = d / 2 - 0.1;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        g.add(block(0.07, 0.74, 0.07, leg, sx * lx, 0.37, sz * lz));
    }
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    return g;
}

export function monitor(screen: THREE.Material, frame: THREE.Material, x: number, y: number, z: number, yaw = 0, w = 0.72) {
    const g = new THREE.Group();
    g.add(block(0.1, 0.2, 0.1, frame, 0, 0.1, 0));
    g.add(block(w, 0.44, 0.05, frame, 0, 0.43, 0));
    g.add(flat(w - 0.07, 0.37, 0.02, screen, 0, 0.43, 0.035));
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    return g;
}

export function deskKit(keyMat: THREE.Material, mugMat: THREE.Material, x: number, z: number, yaw = 0) {
    const g = new THREE.Group();
    // Keyboard, mouse and a paper pad. Mugs are real models, placed separately.
    g.add(flat(0.5, 0.025, 0.19, keyMat, 0, 0.795, 0.26));
    g.add(flat(0.09, 0.03, 0.13, keyMat, 0.35, 0.795, 0.26));
    g.add(flat(0.24, 0.02, 0.32, mugMat, 0.42, 0.79, -0.08));
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    return g;
}

export function chair(mat: THREE.Material, x: number, z: number, yaw = 0) {
    const g = new THREE.Group();
    g.add(block(0.48, 0.09, 0.48, mat, 0, 0.44, 0));
    g.add(block(0.48, 0.5, 0.08, mat, 0, 0.7, -0.21));
    g.add(block(0.09, 0.42, 0.09, mat, 0, 0.22, 0));
    g.add(block(0.42, 0.06, 0.42, mat, 0, 0.04, 0));
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    return g;
}

export function plant(pot: THREE.Material, leaf: THREE.Material, x: number, z: number, scale = 1) {
    const g = new THREE.Group();
    g.add(block(0.3, 0.32, 0.3, pot, 0, 0.16, 0));
    const a = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.32, 0)), leaf);
    a.position.y = 0.62;
    a.castShadow = true;
    g.add(a);
    const b = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.22, 0)), leaf);
    b.position.set(0.16, 0.9, -0.06);
    b.castShadow = true;
    g.add(b);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    return g;
}

export function shelfUnit(frame: THREE.Material, book: THREE.Material[], x: number, z: number, yaw = 0, h = 1.7) {
    const g = new THREE.Group();
    const w = 1.4;
    g.add(block(w, 0.06, 0.34, frame, 0, h, 0));
    g.add(block(0.06, h, 0.34, frame, -w / 2, h / 2, 0));
    g.add(block(0.06, h, 0.34, frame, w / 2, h / 2, 0));
    const levels = [0.42, 0.86, 1.3];
    levels.forEach((ly, li) => {
        g.add(block(w, 0.05, 0.34, frame, 0, ly, 0));
        for (let i = 0; i < 5; i++) {
            const bh = 0.2 + ((i + li) % 3) * 0.06;
            g.add(block(0.1, bh, 0.24, book[(i + li) % book.length], -0.5 + i * 0.24, ly + bh / 2 + 0.03, 0));
        }
    });
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    return g;
}

export function cabinet(body: THREE.Material, handle: THREE.Material, x: number, z: number, yaw = 0) {
    const g = new THREE.Group();
    g.add(block(0.9, 1.1, 0.55, body, 0, 0.55, 0));
    for (const y of [0.28, 0.62, 0.94]) {
        g.add(flat(0.34, 0.04, 0.03, handle, 0, y, 0.29));
    }
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    return g;
}

export function sofa(mat: THREE.Material, x: number, z: number, yaw = 0, w = 2.3) {
    const g = new THREE.Group();
    g.add(block(w, 0.46, 0.95, mat, 0, 0.23, 0));
    g.add(block(w, 0.72, 0.2, mat, 0, 0.58, -0.4));
    g.add(block(0.2, 0.6, 0.95, mat, -w / 2 + 0.1, 0.5, 0));
    g.add(block(0.2, 0.6, 0.95, mat, w / 2 - 0.1, 0.5, 0));
    g.add(block(0.5, 0.14, 0.4, mat, -w / 4, 0.53, 0.06));
    g.add(block(0.5, 0.14, 0.4, mat, w / 4, 0.53, 0.06));
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    return g;
}

/* ------------------------------- STUDIO ---------------------------------- */

export function createStudio(offsetX = 0): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const floorMat = solid(0x343a48, 0.95);
    const plankMat = solid(0x3c4353, 0.95);
    const rugMat = solid(0x414b5c, 1);
    const wallMat = solid(0x424a5b, 0.95);
    const trimMat = solid(0x5d6779, 0.7);
    const deskMat = solid(0xc19a63, 0.7);
    const legMat = solid(0x4c525f, 0.5, 0.4);
    const chairMat = solid(0x2c313d, 0.8);
    const keyMat = solid(0x1e222b, 0.6);
    const mugMat = solid(0xe4ded1, 0.85);
    const metalMat = solid(0x8f98a8, 0.4, 0.65);
    const paperMat = solid(0xf3efe4, 0.95);
    const boxMat = solid(0xcbb28a, 0.95);
    const potMat = solid(0xa9603f, 0.9);
    const leafMat = solid(0x54925a, 0.9);
    const frameMat = solid(0x22262f, 0.6);
    const books = [solid(0x7c4a4a, 0.9), solid(0x40617e, 0.9), solid(0x6b7a4a, 0.9), solid(0xa9884a, 0.9)];

    const screenMat = glow(0x6fd3ff, 0.9);
    const screenWarm = glow(0xffc98a, 0.8);
    const lampMat = glow(0xffd9a0, 1.2);
    const stripMat = glow(0xdff0ff, 0.55);
    const neonMat = glow(0xff7a5c, 0.9);
    const glassMat = trackMat(new THREE.MeshStandardMaterial({
        color: 0xa8dced, transparent: true, opacity: 0.14, roughness: 0.08, metalness: 0.25,
    }));

    // Floor, plank accents, rugs.
    group.add(block(14, 0.3, 11, floorMat, 0, -0.15, 0));
    for (let i = -6; i <= 6; i += 2) {
        group.add(flat(0.06, 0.02, 11, plankMat, i, 0.005, 0));
    }
    group.add(flat(7.2, 0.02, 4.0, rugMat, -3.2, 0.012, -2.0));
    group.add(flat(4.0, 0.02, 3.0, rugMat, 4.2, 0.012, 3.2));

    // Walls, skirting, ceiling beams.
    group.add(block(14, 3.1, 0.25, wallMat, 0, 1.55, -5.6));
    group.add(block(0.25, 3.1, 11, wallMat, -7.0, 1.55, 0));
    group.add(flat(14, 0.14, 0.32, trimMat, 0, 0.07, -5.55));
    group.add(flat(0.32, 0.14, 11, trimMat, -6.95, 0.07, 0));
    group.add(flat(14, 0.12, 0.3, trimMat, 0, 3.08, -5.6));
    for (const x of [-5, -1.5, 2, 5.5]) {
        group.add(flat(0.22, 0.24, 11, trimMat, x, 3.0, 0));
    }

    // Wall art + pinboard + whiteboard on the back wall.
    group.add(flat(2.6, 1.5, 0.07, paperMat, -4.4, 1.85, -5.44));
    group.add(flat(2.7, 0.1, 0.1, frameMat, -4.4, 1.06, -5.42));
    for (let i = 0; i < 7; i++) {
        group.add(flat(0.3, 0.36, 0.02, books[i % books.length], -5.4 + i * 0.34, 1.9, -5.38));
    }
    group.add(flat(1.5, 1.0, 0.07, solid(0x2f3542, 0.9), -1.4, 1.9, -5.44));
    group.add(flat(1.55, 0.08, 0.09, trimMat, -1.4, 2.44, -5.42));
    // Left wall: framed prints.
    [-2.4, -0.6, 1.2].forEach((z, i) => {
        group.add(flat(0.07, 0.86, 1.2, solid(0x50596b, 0.9), -6.85, 1.75, z));
        group.add(flat(0.03, 0.7, 1.02, books[i % books.length], -6.79, 1.75, z));
    });

    // Ceiling strip lights.
    for (const z of [-3.8, -0.6, 2.6]) {
        group.add(flat(9.2, 0.09, 0.3, stripMat, -1.4, 2.88, z));
    }

    /* ---- Mara's glass office (back right) ---- */
    group.add(flat(2.9, 2.45, 0.08, glassMat, 2.65, 1.22, -1.6));
    group.add(flat(1.7, 2.45, 0.08, glassMat, 5.85, 1.22, -1.6));
    group.add(flat(0.08, 2.45, 4.0, glassMat, 1.28, 1.22, -3.6));
    group.add(flat(5.5, 0.1, 0.14, trimMat, 3.9, 2.5, -1.6));
    group.add(flat(0.14, 0.1, 4.0, trimMat, 1.28, 2.5, -3.6));
    group.add(flat(0.1, 2.3, 0.1, trimMat, 4.2, 1.15, -1.6));
    group.add(desk(deskMat, legMat, 4.3, -4.3, 2.3, 1.0));
    group.add(monitor(screenWarm, frameMat, 4.7, 0.78, -4.45, Math.PI, 0.9));
    group.add(deskKit(keyMat, mugMat, 4.3, -4.3, Math.PI));
    group.add(chair(chairMat, 4.9, -3.4, 0));
    group.add(flat(2.1, 1.25, 0.06, glow(0x8fbfe0, 0.32), 5.6, 1.6, -5.4));
    group.add(flat(2.15, 0.08, 0.1, trimMat, 5.6, 2.27, -5.38));
    group.add(shelfUnit(deskMat, books, 2.3, -5.2, 0, 1.6));
    group.add(plant(potMat, leafMat, 6.4, -2.3, 1.1));

    /* ---- Open plan desks ---- */
    // Jonah.
    group.add(desk(deskMat, legMat, -3.6, -3.4));
    group.add(monitor(screenMat, frameMat, -3.6, 0.78, -3.75, 0, 0.8));
    group.add(monitor(screenMat, frameMat, -2.7, 0.78, -3.6, -0.5, 0.6));
    group.add(deskKit(keyMat, mugMat, -3.6, -3.4));
    group.add(chair(chairMat, -3.6, -2.55, Math.PI));
    // You.
    group.add(desk(deskMat, legMat, 0.4, -3.6, 1.7, 1.0));
    group.add(monitor(screenMat, frameMat, 0.4, 0.78, -3.9, 0, 0.74));
    group.add(deskKit(keyMat, mugMat, 0.4, -3.6));
    group.add(chair(chairMat, 0.4, -2.75, Math.PI));
    // Background team desks (with people added in world.ts).
    group.add(desk(deskMat, legMat, -5.4, -0.9, 1.7, 1.0));
    group.add(monitor(screenMat, frameMat, -5.4, 0.78, -1.2, 0, 0.7));
    group.add(deskKit(keyMat, mugMat, -5.4, -0.9));
    group.add(chair(chairMat, -5.4, -0.1, Math.PI));
    group.add(desk(deskMat, legMat, -2.6, -0.9, 1.7, 1.0));
    group.add(monitor(screenMat, frameMat, -2.6, 0.78, -1.2, 0, 0.7));
    group.add(deskKit(keyMat, mugMat, -2.6, -0.9));
    group.add(chair(chairMat, -2.6, -0.1, Math.PI));

    // Promotion dressing: a bigger corner desk with a good lamp.
    const promoGroup = new THREE.Group();
    promoGroup.add(desk(deskMat, legMat, 1.85, -3.2, 1.2, 0.95));
    promoGroup.add(monitor(screenMat, frameMat, 1.8, 0.78, -3.5, -0.55, 0.68));
    promoGroup.add(block(0.16, 0.52, 0.16, lampMat, -0.4, 1.0, -3.95));
    promoGroup.add(plant(potMat, leafMat, 1.9, -2.4, 0.8));
    promoGroup.visible = false;
    group.add(promoGroup);

    /* ---- Break area (front right) ---- */
    group.add(block(1.9, 0.9, 0.75, solid(0x555f6e, 0.8), 5.4, 0.45, 3.7));
    group.add(flat(2.0, 0.07, 0.85, deskMat, 5.4, 0.94, 3.7));
    group.add(block(0.6, 0.85, 0.5, metalMat, 5.6, 1.35, 3.6));
    group.add(flat(0.42, 0.12, 0.3, neonMat, 5.6, 1.12, 3.34));
    group.add(block(0.16, 0.2, 0.16, mugMat, 5.0, 1.05, 3.55));
    group.add(block(0.16, 0.2, 0.16, mugMat, 4.75, 1.05, 3.8));
    group.add(flat(1.7, 0.06, 0.95, deskMat, 3.4, 0.72, 4.3));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        group.add(block(0.07, 0.72, 0.07, legMat, 3.4 + sx * 0.75, 0.36, 4.3 + sz * 0.38));
    }
    group.add(chair(chairMat, 2.5, 4.3, Math.PI / 2));
    group.add(chair(chairMat, 4.3, 4.3, -Math.PI / 2));
    group.add(sofa(solid(0x4c5568, 0.95), 6.2, 1.2, -Math.PI / 2, 2.0));
    group.add(flat(0.9, 0.06, 0.6, deskMat, 4.9, 0.42, 1.2));
    // Water cooler.
    group.add(block(0.42, 1.0, 0.42, metalMat, 6.5, 0.5, 4.7));
    group.add(block(0.36, 0.45, 0.36, glow(0x9fdcff, 0.35), 6.5, 1.22, 4.7));

    /* ---- Printer + supplies (front left) ---- */
    group.add(block(1.0, 0.8, 0.75, solid(0x6d7684, 0.7), -4.6, 0.4, 2.9));
    group.add(flat(0.8, 0.05, 0.55, paperMat, -4.6, 0.83, 2.9));
    group.add(flat(0.5, 0.16, 0.4, solid(0x3a4150, 0.7), -4.6, 0.95, 3.1));
    group.add(cabinet(solid(0x5a6373, 0.8), metalMat, -6.3, 1.4, Math.PI / 2));
    group.add(cabinet(solid(0x5a6373, 0.8), metalMat, -6.3, 2.6, Math.PI / 2));
    group.add(block(0.9, 0.65, 0.65, boxMat, -6.2, 0.33, 4.5));
    group.add(block(0.75, 0.5, 0.5, boxMat, -5.3, 0.25, 4.8));
    group.add(block(0.5, 0.6, 0.5, solid(0x39404e, 0.9), -3.4, 0.3, 4.6));
    // Coat rack.
    group.add(block(0.1, 1.85, 0.1, frameMat, -1.9, 0.92, 4.8));
    group.add(flat(0.7, 0.07, 0.07, frameMat, -1.9, 1.78, 4.8));
    group.add(block(0.34, 0.7, 0.22, solid(0x6b5a7a, 0.95), -2.12, 1.4, 4.78));
    group.add(block(0.34, 0.66, 0.22, solid(0x4a5d6b, 0.95), -1.66, 1.42, 4.78));
    group.add(plant(potMat, leafMat, -6.3, -4.7, 1.15));
    group.add(plant(potMat, leafMat, 0.2, 4.7, 0.95));
    // Arcade cabinet — studio flavour.
    group.add(block(0.75, 1.7, 0.7, solid(0x3b3050, 0.85), 1.4, 0.85, 4.6));
    group.add(flat(0.6, 0.5, 0.06, glow(0xff8fd0, 0.7), 1.4, 1.35, 4.26));
    group.add(flat(0.66, 0.3, 0.4, solid(0x241c33, 0.8), 1.4, 0.98, 4.3));

    // Practical lights.
    const deskLight = new THREE.PointLight(0xffc48a, 3, 6, 2);
    deskLight.position.set(0.4, 1.6, -3.3);
    group.add(deskLight);
    const officeLight = new THREE.PointLight(0xffd9a8, 2.4, 7.5, 2);
    officeLight.position.set(4.4, 1.9, -4.1);
    group.add(officeLight);
    const breakLight = new THREE.PointLight(0xff9f6a, 1.6, 6, 2);
    breakLight.position.set(5.2, 1.7, 3.7);
    group.add(breakLight);
    const teamLight = new THREE.PointLight(0x9fd0ff, 1.4, 6, 2);
    teamLight.position.set(-4.0, 1.6, -1.0);
    group.add(teamLight);

    // Burnout clutter around your desk.
    const clutter: THREE.Object3D[] = [];
    const clutterSpecs: [number, number, number, number, number, number, THREE.Material][] = [
        [0.15, 0.18, 0.15, -0.25, 0.87, -3.35, mugMat],
        [0.15, 0.18, 0.15, 0.95, 0.87, -3.3, mugMat],
        [0.15, 0.18, 0.15, 1.05, 0.87, -3.75, mugMat],
        [0.45, 0.1, 0.45, -0.15, 0.05, -2.5, boxMat],
        [0.4, 0.1, 0.4, 1.0, 0.05, -2.4, boxMat],
        [0.3, 0.22, 0.24, 0.75, 0.11, -2.9, paperMat],
    ];
    for (const [w, h, d, x, y, z, mat] of clutterSpecs) {
        const item = block(w, h, d, mat, x, y, z);
        item.visible = false;
        clutter.push(item);
        group.add(item);
    }

    return {
        group,
        setMood({ night, burnout }) {
            const grime = burnout / 100;
            stripMat.emissiveIntensity = 0.35 + night * 0.8;
            screenMat.emissiveIntensity = 0.7 + night * 0.9;
            screenWarm.emissiveIntensity = 0.7 + night * 0.8;
            neonMat.emissiveIntensity = 0.6 + night * 0.9;
            deskLight.intensity = 3 + night * 5;
            officeLight.intensity = 2.4 + night * 4;
            breakLight.intensity = 1.6 + night * 2.6;
            teamLight.intensity = (1.4 + night * 1.6) * (1 - grime * 0.3);
            floorMat.color.setHex(0x343a48).lerp(new THREE.Color(0x24262e), grime * 0.6);
            wallMat.color.setHex(0x424a5b).lerp(new THREE.Color(0x323744), grime * 0.5 + night * 0.25);
        },
        setPromoted(on) { promoGroup.visible = on; },
        setClutter(level) {
            const shown = Math.floor(Math.max(0, Math.min(1, (level - 35) / 55)) * clutter.length);
            clutter.forEach((c, i) => { c.visible = i < shown; });
        },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}

/* ------------------------------ APARTMENT -------------------------------- */

export function createApartment(offsetX = 0): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const floorMat = solid(0x574a41, 0.95);
    const plankMat = solid(0x4d423a, 0.95);
    const rugMat = solid(0x7a5f52, 1);
    const wallMat = solid(0x574c56, 0.95);
    const trimMat = solid(0x6d6270, 0.8);
    const woodMat = solid(0xb0834f, 0.75);
    const darkWood = solid(0x6f5334, 0.8);
    const legMat = solid(0x3f382f, 0.6);
    const softMat = solid(0x6f6472, 0.95);
    const sheetMat = solid(0xdcd6ca, 0.95);
    const frameMat = solid(0x262430, 0.6);
    const metalMat = solid(0x9aa0ac, 0.4, 0.6);
    const paperMat = solid(0xf1ece0, 0.95);
    const books = [solid(0x7b4550, 0.9), solid(0x3f5f75, 0.9), solid(0x6a7a4c, 0.9), solid(0xb08a4c, 0.9)];

    const screenMat = glow(0x88ccff, 1.0);
    const lampMat = glow(0xffcf94, 1.3);
    const tvMat = glow(0x6fa8d8, 0.5);
    const phoneMat = glow(0x9fe8c7, 1.1);
    const cityMat = glow(0xffd79a, 0.8);
    const ceilingMat = glow(0xffe6c0, 0.5);
    const skyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x1b2438 }));

    group.add(block(10, 0.3, 9, floorMat, 0, -0.15, 0));
    for (let i = -4; i <= 4; i++) {
        group.add(flat(0.05, 0.02, 9, plankMat, i, 0.005, 0));
    }
    group.add(flat(5.0, 0.02, 3.2, rugMat, -1.9, 0.012, 2.0));
    group.add(flat(2.6, 0.02, 2.0, rugMat, -2.6, 0.012, -2.6));

    group.add(block(10, 3.0, 0.25, wallMat, 0, 1.5, -4.6));
    group.add(block(0.25, 3.0, 9, wallMat, -5.0, 1.5, 0));
    group.add(flat(10, 0.13, 0.3, trimMat, 0, 0.065, -4.55));
    group.add(flat(0.3, 0.13, 9, trimMat, -4.95, 0.065, 0));
    group.add(flat(10, 0.1, 0.28, trimMat, 0, 2.97, -4.6));

    /* ---- Window + city skyline ---- */
    group.add(flat(3.7, 2.05, 0.04, skyMat, 0, 1.6, -4.45));
    // A faint far silhouette; real buildings are placed beyond the window by the
    // dressing pass, so this only fills the gaps between them.
    const cityHeights = [0.4, 0.7, 0.5, 0.9, 0.6];
    cityHeights.forEach((h, i) => {
        group.add(flat(0.26, h, 0.04, cityMat, -1.4 + i * 0.72, 0.62 + h / 2, -4.43));
    });
    group.add(flat(3.9, 0.1, 0.13, frameMat, 0, 2.68, -4.4));
    group.add(flat(3.9, 0.1, 0.13, frameMat, 0, 0.56, -4.4));
    group.add(flat(0.1, 2.15, 0.13, frameMat, 0, 1.62, -4.4));
    group.add(flat(0.1, 2.15, 0.13, frameMat, -1.95, 1.62, -4.4));
    group.add(flat(0.1, 2.15, 0.13, frameMat, 1.95, 1.62, -4.4));
    // Curtains.
    group.add(block(0.4, 2.2, 0.16, softMat, -2.25, 1.6, -4.34));
    group.add(block(0.4, 2.2, 0.16, softMat, 2.25, 1.6, -4.34));
    group.add(block(0.16, 0.14, 0.2, woodMat, 0, 1.0, -4.2));

    /* ---- Work desk ---- */
    group.add(desk(woodMat, legMat, -2.6, -3.5, 1.9, 0.95));
    group.add(monitor(screenMat, frameMat, -2.6, 0.78, -3.8, 0, 0.8));
    group.add(deskKit(solid(0x22202a, 0.6), sheetMat, -2.6, -3.5));
    group.add(chair(softMat, -2.6, -2.65, Math.PI));
    group.add(block(0.14, 0.46, 0.14, lampMat, -3.42, 0.97, -3.72));
    group.add(flat(0.3, 0.1, 0.14, lampMat, -3.42, 1.22, -3.6));
    // Shelf above the desk.
    group.add(flat(1.8, 0.07, 0.3, woodMat, -2.6, 1.6, -4.4));
    for (let i = 0; i < 6; i++) {
        const bh = 0.22 + (i % 3) * 0.05;
        group.add(block(0.11, bh, 0.22, books[i % books.length], -3.3 + i * 0.26, 1.64 + bh / 2, -4.4));
    }
    group.add(plant(solid(0x8a5a3c, 0.9), solid(0x548a58, 0.9), -1.5, -4.2, 0.7));

    /* ---- Bed ---- */
    group.add(block(2.1, 0.4, 2.7, darkWood, 3.2, 0.2, -1.6));
    group.add(block(2.0, 0.26, 2.5, sheetMat, 3.2, 0.51, -1.6));
    group.add(block(1.9, 0.14, 1.2, softMat, 3.2, 0.68, -0.9));
    group.add(block(0.95, 0.2, 0.5, sheetMat, 3.2, 0.72, -2.6));
    group.add(block(2.1, 1.0, 0.14, darkWood, 3.2, 0.5, -3.0));
    // Nightstand + lamp + book.
    group.add(block(0.55, 0.55, 0.5, darkWood, 1.85, 0.28, -2.85));
    group.add(block(0.14, 0.36, 0.14, lampMat, 1.85, 0.73, -2.85));
    group.add(flat(0.26, 0.05, 0.2, books[0], 1.85, 0.58, -2.6));

    /* ---- Living area ---- */
    group.add(sofa(softMat, -2.4, 2.7, 0, 2.4));
    group.add(flat(1.35, 0.07, 0.75, woodMat, -2.4, 0.44, 1.35));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        group.add(block(0.07, 0.44, 0.07, legMat, -2.4 + sx * 0.58, 0.22, 1.35 + sz * 0.28));
    }
    group.add(block(0.13, 0.14, 0.13, sheetMat, -2.1, 0.54, 1.35));
    group.add(flat(0.3, 0.04, 0.24, books[1], -2.75, 0.5, 1.3));
    // TV unit on the left wall.
    group.add(block(0.5, 0.5, 1.9, darkWood, -4.5, 0.25, 1.6));
    group.add(flat(0.08, 0.85, 1.5, frameMat, -4.35, 1.05, 1.6));
    group.add(flat(0.03, 0.72, 1.36, tvMat, -4.29, 1.05, 1.6));
    group.add(shelfUnit(darkWood, books, -4.55, -1.1, Math.PI / 2, 1.75));
    // Guitar leaning by the shelf.
    group.add(block(0.1, 1.0, 0.28, darkWood, -4.3, 0.5, 0.2));
    group.add(block(0.08, 0.55, 0.1, woodMat, -4.3, 1.25, 0.2));

    /* ---- Kitchen ---- */
    group.add(block(2.8, 0.9, 0.85, solid(0x5f5560, 0.85), 3.0, 0.45, 3.3));
    group.add(flat(2.9, 0.08, 0.95, woodMat, 3.0, 0.94, 3.3));
    group.add(flat(0.5, 0.06, 0.4, metalMat, 3.6, 0.98, 3.3));
    group.add(block(0.1, 0.3, 0.1, metalMat, 3.6, 1.14, 3.55));
    group.add(flat(0.2, 0.03, 0.42, phoneMat, 2.3, 1.0, 3.2));
    group.add(block(0.16, 0.2, 0.16, sheetMat, 2.0, 1.05, 3.45));
    // Fridge in the back corner.
    group.add(block(0.85, 1.8, 0.75, metalMat, 4.4, 0.9, -3.9));
    group.add(flat(0.03, 0.6, 0.06, frameMat, 3.96, 1.2, -3.9));
    group.add(flat(0.2, 0.26, 0.02, paperMat, 3.96, 1.5, -3.7));
    // Upper shelves.
    group.add(flat(2.4, 0.07, 0.3, woodMat, 3.2, 1.7, 4.3));
    for (let i = 0; i < 5; i++) {
        group.add(block(0.18, 0.2, 0.18, sheetMat, 2.3 + i * 0.42, 1.83, 4.3));
    }
    group.add(block(0.5, 0.65, 0.5, solid(0x3f3a44, 0.9), 4.6, 0.32, 2.2));
    group.add(plant(solid(0x8a5a3c, 0.9), solid(0x4f7f52, 0.9), 4.5, 0.9, 1.05));

    // Pendant light + ceiling.
    group.add(flat(0.06, 0.6, 0.06, frameMat, 0, 2.65, 0.6));
    group.add(flat(0.55, 0.2, 0.55, ceilingMat, 0, 2.3, 0.6));

    const roomLight = new THREE.PointLight(0xffcf9a, 5, 10, 2);
    roomLight.position.set(0, 2.2, 0.6);
    group.add(roomLight);
    const monitorLight = new THREE.PointLight(0x8fd4ff, 1.6, 5.5, 2);
    monitorLight.position.set(-2.6, 1.3, -3.1);
    group.add(monitorLight);
    const lampLight = new THREE.PointLight(0xffc07a, 2.2, 5, 2);
    lampLight.position.set(-3.4, 1.3, -3.6);
    group.add(lampLight);
    const bedLight = new THREE.PointLight(0xffb877, 1.2, 4.5, 2);
    bedLight.position.set(1.85, 1.1, -2.85);
    group.add(bedLight);

    // Burnout clutter: dishes, laundry, boxes.
    const clutter: THREE.Object3D[] = [];
    const trashMat = solid(0xbfb49f, 0.95);
    const clothesMat = solid(0x5f4d62, 1);
    const clutterSpecs: [number, number, number, number, number, number, THREE.Material][] = [
        [0.52, 0.13, 0.52, -1.6, 0.065, -2.9, trashMat],
        [0.46, 0.11, 0.46, -1.4, 0.19, -2.7, trashMat],
        [0.17, 0.21, 0.17, -2.1, 0.89, -3.35, sheetMat],
        [0.17, 0.21, 0.17, -3.05, 0.89, -3.3, sheetMat],
        [0.7, 0.2, 0.5, 0.9, 0.1, 1.5, clothesMat],
        [0.6, 0.17, 0.45, 1.6, 0.085, 0.5, clothesMat],
        [0.55, 0.34, 0.42, -4.3, 0.17, 3.4, trashMat],
        [0.4, 0.12, 0.34, -2.4, 0.52, 1.4, trashMat],
    ];
    for (const [w, h, d, x, y, z, mat] of clutterSpecs) {
        const item = block(w, h, d, mat, x, y, z);
        item.visible = false;
        clutter.push(item);
        group.add(item);
    }

    return {
        group,
        setMood({ night, burnout }) {
            const grime = burnout / 100;
            ceilingMat.emissiveIntensity = 0.5 - grime * 0.28;
            screenMat.emissiveIntensity = 0.8 + night * 0.9;
            tvMat.emissiveIntensity = 0.35 + night * 0.4;
            roomLight.intensity = (5.5 - night * 2.0) * (1 - grime * 0.5);
            monitorLight.intensity = 1.6 + night * 3.0;
            lampLight.intensity = (2.2 + night * 1.5) * (1 - grime * 0.35);
            bedLight.intensity = 1.0 + night * 1.4;
            lampMat.emissiveIntensity = 1.3 * (1 - grime * 0.45);
            cityMat.emissiveIntensity = 0.35 + night * 1.1;
            skyMat.color.setHex(0x2c3b58).lerp(new THREE.Color(0x0a0f1c), night);
            floorMat.color.setHex(0x574a41).lerp(new THREE.Color(0x322a26), grime * 0.7);
            wallMat.color.setHex(0x574c56).lerp(new THREE.Color(0x332e36), grime * 0.75);
        },
        setPromoted() { /* home does not change with promotion */ },
        setClutter(level) {
            const shown = Math.floor(Math.max(0, Math.min(1, (level - 25) / 60)) * clutter.length);
            clutter.forEach((c, i) => { c.visible = i < shown; });
        },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}

export function disposeDioramaPools() {
    for (const g of geoms) g.dispose();
    for (const m of mats) m.dispose();
    geoms.length = 0;
    mats.length = 0;
}
