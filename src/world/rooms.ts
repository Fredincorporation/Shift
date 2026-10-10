/**
 * The places that open up as the story grows: the bar where Priya waits, your
 * family's house, and the publisher's office. Each is a self-contained diorama
 * built from the shared prop helpers, placed at its own offset in the world.
 */
import * as THREE from 'three';
import {
    block, cabinet, chair, flat, glow, plant, shelfUnit, sofa, solid, trackMat, type Diorama,
} from './diorama.ts';

/* --------------------------------- BAR ----------------------------------- */

export function createBar(offsetX: number): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const floorMat = solid(0x3b2a26, 0.9);
    const plankMat = solid(0x33241f, 0.9);
    const wallMat = solid(0x40302f, 0.95);
    const trimMat = solid(0x59433f, 0.8);
    const woodMat = solid(0x8a5c35, 0.7);
    const darkWood = solid(0x5b3b23, 0.8);
    const legMat = solid(0x2e2520, 0.6);
    const brassMat = solid(0xc79a54, 0.35, 0.7);
    const leatherMat = solid(0x6b3f3a, 0.85);
    const clothMat = solid(0x4a4038, 0.95);
    const bottleMats = [glow(0x9fd8a8, 0.25), glow(0xd8b47f, 0.25), glow(0xc98fa8, 0.25), glow(0x8fb8d8, 0.25)];
    const books = [solid(0x7c4a4a, 0.9), solid(0x40617e, 0.9), solid(0x6b7a4a, 0.9), solid(0xa9884a, 0.9)];

    const neonMat = glow(0xff5f8f, 1.2);
    const neonBlue = glow(0x5fd8ff, 1.0);
    const bulbMat = glow(0xffcf8a, 1.4);
    const skyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x141c2e }));
    const cityMat = glow(0xffd79a, 0.9);

    // Floor + walls.
    group.add(block(11, 0.3, 9, floorMat, 0, -0.15, 0));
    for (let i = -5; i <= 5; i++) {
        group.add(flat(0.05, 0.02, 9, plankMat, i, 0.005, 0));
    }
    group.add(block(11, 3.2, 0.25, wallMat, 0, 1.6, -4.6));
    group.add(block(0.25, 3.2, 9, wallMat, -5.5, 1.6, 0));
    group.add(flat(11, 0.14, 0.3, trimMat, 0, 0.07, -4.55));
    group.add(flat(0.3, 0.14, 9, trimMat, -5.45, 0.07, 0));
    group.add(flat(11, 0.12, 0.3, trimMat, 0, 3.16, -4.6));

    // Street window with the city outside.
    group.add(flat(3.4, 1.9, 0.04, skyMat, -2.2, 1.7, -4.45));
    // Faint far silhouette only — real buildings sit beyond the glass.
    [0.45, 0.7, 0.55].forEach((h, i) => {
        group.add(flat(0.28, h, 0.04, cityMat, -3.4 + i * 1.1, 0.78 + h / 2, -4.43));
    });
    group.add(flat(3.5, 0.1, 0.13, darkWood, -2.2, 2.68, -4.4));
    group.add(flat(3.5, 0.1, 0.13, darkWood, -2.2, 0.72, -4.4));
    group.add(flat(0.1, 2.0, 0.13, darkWood, -2.2, 1.7, -4.4));

    // Neon signage.
    group.add(flat(1.9, 0.5, 0.08, neonMat, 2.3, 2.35, -4.42));
    group.add(flat(0.16, 1.3, 0.08, neonBlue, 4.4, 1.8, -4.42));

    /* ---- The bar itself, along the back-right ---- */
    group.add(block(5.2, 1.05, 0.75, darkWood, 2.6, 0.52, -3.2));
    group.add(flat(5.4, 0.1, 0.95, woodMat, 2.6, 1.1, -3.2));
    group.add(flat(5.3, 0.06, 0.12, brassMat, 2.6, 0.55, -2.86));
    // Back shelves of bottles.
    group.add(flat(5.0, 0.08, 0.32, darkWood, 2.6, 1.55, -4.3));
    group.add(flat(5.0, 0.08, 0.32, darkWood, 2.6, 2.05, -4.3));
    // A few painted bottles fill the shelf between the real bottle models.
    for (let i = 0; i < 8; i++) {
        const mat = bottleMats[i % bottleMats.length];
        const row = i < 4 ? 1.62 : 2.12;
        const x = 0.95 + (i % 4) * 0.72;
        group.add(block(0.12, 0.34, 0.12, mat, x, row + 0.17, -4.3));
    }
    // Taps + glasses.
    for (let i = 0; i < 4; i++) {
        group.add(block(0.08, 0.34, 0.08, brassMat, 1.4 + i * 0.26, 1.28, -3.4));
    }
    // Real glassware is placed on the counter by the dressing pass.

    // Bar stools.
    for (let i = 0; i < 5; i++) {
        const x = 0.7 + i * 0.9;
        group.add(block(0.09, 0.72, 0.09, brassMat, x, 0.36, -2.5));
        group.add(block(0.38, 0.11, 0.38, leatherMat, x, 0.77, -2.5));
    }

    /* ---- Booths along the left wall ---- */
    for (const z of [-2.6, -0.6, 1.4]) {
        group.add(block(0.4, 1.3, 1.6, leatherMat, -5.05, 0.65, z));
        group.add(sofa(leatherMat, -4.2, z, Math.PI / 2, 1.5));
        group.add(flat(0.95, 0.07, 0.85, woodMat, -3.1, 0.72, z));
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
            group.add(block(0.06, 0.72, 0.06, legMat, -3.1 + sx * 0.4, 0.36, z + sz * 0.35));
        }
        group.add(block(0.11, 0.22, 0.11, bulbMat, -3.1, 0.83, z));
        group.add(chair(clothMat, -2.1, z, -Math.PI / 2));
    }

    /* ---- Standing tables + jukebox + pool table area ---- */
    group.add(flat(0.9, 0.07, 0.9, woodMat, 0.4, 1.02, 1.6));
    group.add(block(0.14, 1.02, 0.14, legMat, 0.4, 0.51, 1.6));
    group.add(block(0.5, 0.05, 0.5, legMat, 0.4, 0.03, 1.6));
    group.add(flat(0.9, 0.07, 0.9, woodMat, 0.4, 1.02, 3.4));
    group.add(block(0.14, 1.02, 0.14, legMat, 0.4, 0.51, 3.4));
    group.add(block(0.5, 0.05, 0.5, legMat, 0.4, 0.03, 3.4));
    // Jukebox.
    group.add(block(0.85, 1.5, 0.6, darkWood, 4.7, 0.75, 0.4));
    group.add(flat(0.66, 0.6, 0.06, glow(0xff9f5c, 0.9), 4.38, 1.05, 0.4));
    group.add(flat(0.66, 0.14, 0.06, neonBlue, 4.38, 1.5, 0.4));
    // Pool table.
    group.add(block(2.6, 0.72, 1.5, darkWood, 3.0, 0.36, 3.2));
    group.add(flat(2.4, 0.06, 1.3, solid(0x2f6b4a, 0.95), 3.0, 0.75, 3.2));
    for (let i = 0; i < 5; i++) {
        group.add(block(0.11, 0.11, 0.11, glow(0xf0e6d2, 0.15), 2.4 + i * 0.28, 0.83, 3.2));
    }
    group.add(block(0.06, 1.3, 0.06, woodMat, 1.5, 0.65, 4.1));

    // Dartboard + wall dressing.
    group.add(flat(0.5, 0.5, 0.07, solid(0x7a3f3f, 0.9), 0.9, 1.8, -4.44));
    group.add(flat(0.34, 0.34, 0.03, solid(0xe8dcc4, 0.9), 0.9, 1.8, -4.4));
    group.add(shelfUnit(darkWood, books, -1.0, -4.3, 0, 1.4));
    group.add(plant(solid(0x6f4a34, 0.9), solid(0x4c7a52, 0.9), 5.1, 4.4, 1.1));
    group.add(cabinet(darkWood, brassMat, -5.1, 3.6, Math.PI / 2));

    // Framed prints and band posters along the left wall.
    [-3.4, -1.4, 0.6, 2.6].forEach((z, i) => {
        group.add(flat(0.07, 0.8, 1.0, darkWood, -5.35, 1.9, z));
        group.add(flat(0.03, 0.66, 0.84, books[i % books.length], -5.29, 1.9, z));
    });
    // Chalkboard specials by the bar.
    group.add(flat(1.3, 0.95, 0.07, solid(0x23201d, 0.95), 5.0, 1.85, -4.42));
    for (let i = 0; i < 4; i++) {
        group.add(flat(0.9 - i * 0.12, 0.05, 0.02, solid(0xd8cfae, 0.9), 4.9, 2.15 - i * 0.22, -4.38));
    }
    // Beer mats, bowls and bottles left on the counter.
    for (let i = 0; i < 6; i++) {
        group.add(flat(0.2, 0.012, 0.2, solid(0x7a5f4a, 0.95), 0.6 + i * 0.82, 1.16, -3.05));
    }
    group.add(block(0.3, 0.11, 0.3, solid(0xd8c9a8, 0.9), 1.15, 1.21, -3.35));
    group.add(block(0.3, 0.11, 0.3, solid(0xd8c9a8, 0.9), 4.05, 1.21, -3.35));
    for (let i = 0; i < 4; i++) {
        group.add(block(0.11, 0.3, 0.11, bottleMats[i % bottleMats.length], 0.5 + i * 0.3, 1.26, -3.5));
    }
    // Bar back: till, optics rail, fridge with a lit door.
    group.add(block(0.5, 0.35, 0.4, solid(0x2f2a26, 0.7), 0.3, 1.28, -3.7));
    group.add(block(0.9, 1.0, 0.5, solid(0x3a332e, 0.8), 5.4, 0.5, -4.0));
    group.add(flat(0.7, 0.7, 0.05, glow(0xa8d8ff, 0.4), 5.4, 0.62, -3.74));
    // Coat hooks + umbrella stand by the door.
    group.add(flat(1.6, 0.08, 0.08, brassMat, -3.6, 1.9, -4.5));
    group.add(block(0.32, 0.62, 0.2, solid(0x4a3f4a, 0.95), -4.0, 1.5, -4.42));
    group.add(block(0.3, 0.6, 0.2, solid(0x3f4a52, 0.95), -3.3, 1.5, -4.42));
    group.add(block(0.3, 0.7, 0.3, darkWood, -0.2, 0.35, 4.5));
    // Bar rail and a step down to the pool area.
    group.add(flat(3.4, 0.1, 0.1, brassMat, 2.4, 0.95, 1.0));
    for (const x of [0.8, 2.4, 4.0]) {
        group.add(block(0.08, 0.95, 0.08, brassMat, x, 0.48, 1.0));
    }
    group.add(plant(solid(0x6f4a34, 0.9), solid(0x53804f, 0.9), -0.9, 2.4, 0.95));
    group.add(cabinet(darkWood, brassMat, 5.2, -0.9, -Math.PI / 2));

    // Pendant bulbs over the bar and booths.
    for (const [x, z] of [[1.4, -2.4], [3.6, -2.4], [-3.1, -2.6], [-3.1, 1.4], [0.4, 2.5]] as const) {
        group.add(flat(0.05, 0.55, 0.05, legMat, x, 2.85, z));
        group.add(flat(0.28, 0.22, 0.28, bulbMat, x, 2.5, z));
    }

    const barLight = new THREE.PointLight(0xffb066, 4.2, 9, 2);
    barLight.position.set(2.5, 2.2, -2.6);
    group.add(barLight);
    const boothLight = new THREE.PointLight(0xff9a5c, 3.0, 8, 2);
    boothLight.position.set(-3.4, 2.1, -0.6);
    group.add(boothLight);
    const neonLight = new THREE.PointLight(0xff5f8f, 2.2, 7, 2);
    neonLight.position.set(2.6, 2.3, -4.1);
    group.add(neonLight);
    const poolLight = new THREE.PointLight(0xffd08a, 2.0, 6, 2);
    poolLight.position.set(3.0, 2.0, 3.2);
    group.add(poolLight);

    // Empty glasses gather on the bar as the night (and burnout) goes on.
    const clutter: THREE.Object3D[] = [];
    const glassMat = glow(0xdfe6ea, 0.1);
    const specs: [number, number, number][] = [
        [1.0, 1.2, -3.0], [1.9, 1.2, -3.1], [2.7, 1.2, -2.95], [-3.1, 0.82, -2.6],
        [-3.1, 0.82, 1.4], [0.4, 1.12, 1.6],
    ];
    for (const [x, y, z] of specs) {
        const item = block(0.13, 0.18, 0.13, glassMat, x, y, z);
        item.visible = false;
        clutter.push(item);
        group.add(item);
    }

    return {
        group,
        setMood({ night, burnout }) {
            const grime = burnout / 100;
            // A bar is always evening-lit; night only deepens it.
            barLight.intensity = 4.2 + night * 1.6;
            boothLight.intensity = 3.0 + night * 1.2;
            neonLight.intensity = 2.2 + night * 1.4;
            poolLight.intensity = 2.0 + night * 0.8;
            neonMat.emissiveIntensity = 1.0 + night * 0.5;
            neonBlue.emissiveIntensity = 0.85 + night * 0.5;
            bulbMat.emissiveIntensity = 1.3 + night * 0.35;
            cityMat.emissiveIntensity = 0.5 + night * 0.9;
            skyMat.color.setHex(0x243349).lerp(new THREE.Color(0x0b1120), night);
            floorMat.color.setHex(0x3b2a26).lerp(new THREE.Color(0x2a1e1b), grime * 0.5);
        },
        setPromoted() { /* the bar does not care about your job title */ },
        setClutter(level) {
            const shown = Math.floor(Math.max(0, Math.min(1, (level - 20) / 60)) * clutter.length);
            clutter.forEach((c, i) => { c.visible = i < shown; });
        },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}

/* ----------------------------- FAMILY HOUSE ------------------------------ */

export function createFamilyHouse(offsetX: number): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const floorMat = solid(0x6b5340, 0.9);
    const plankMat = solid(0x5e4837, 0.9);
    const rugMat = solid(0x8f5f52, 1);
    const wallMat = solid(0x7a6a58, 0.95);
    const trimMat = solid(0xa4907a, 0.85);
    const woodMat = solid(0xb98a55, 0.72);
    const darkWood = solid(0x7a5734, 0.8);
    const legMat = solid(0x4a3a28, 0.6);
    const softMat = solid(0x8a6f5c, 0.95);
    const clothMat = solid(0xc7ac8a, 0.95);
    const sheetMat = solid(0xeae2d2, 0.95);
    const metalMat = solid(0xa8aeb8, 0.4, 0.6);
    const frameMat = solid(0x4a3f36, 0.7);
    const books = [solid(0x8a4f4f, 0.9), solid(0x46647e, 0.9), solid(0x6f7f52, 0.9), solid(0xb08f52, 0.9)];
    const foodMats = [solid(0xd8a05c, 0.85), solid(0xa8bf72, 0.85), solid(0xc76b5c, 0.85), solid(0xe8d9a8, 0.9)];

    const lampMat = glow(0xffd6a0, 1.3);
    const tvMat = glow(0x8fc0e0, 0.5);
    const fireMat = glow(0xff8a4a, 1.2);
    const skyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x2e4258 }));
    const gardenMat = solid(0x4f7a4a, 0.95);

    group.add(block(11.5, 0.3, 9.5, floorMat, 0, -0.15, 0));
    for (let i = -5; i <= 5; i++) {
        group.add(flat(0.06, 0.02, 9.5, plankMat, i, 0.005, 0));
    }
    group.add(flat(5.2, 0.02, 3.6, rugMat, -1.4, 0.012, 1.8));

    group.add(block(11.5, 3.1, 0.25, wallMat, 0, 1.55, -4.85));
    group.add(block(0.25, 3.1, 9.5, wallMat, -5.75, 1.55, 0));
    group.add(flat(11.5, 0.15, 0.32, trimMat, 0, 0.075, -4.8));
    group.add(flat(0.32, 0.15, 9.5, trimMat, -5.7, 0.075, 0));
    group.add(flat(11.5, 0.12, 0.3, trimMat, 0, 3.07, -4.85));
    // Dado rail + wallpaper stripe: an older, lived-in house.
    group.add(flat(11.5, 0.08, 0.28, trimMat, 0, 1.15, -4.79));

    /* ---- Garden window ---- */
    group.add(flat(3.2, 1.8, 0.04, skyMat, 3.2, 1.85, -4.72));
    group.add(flat(3.2, 0.36, 0.05, gardenMat, 3.2, 1.12, -4.7));
    group.add(flat(3.3, 0.1, 0.14, woodMat, 3.2, 2.8, -4.64));
    group.add(flat(3.3, 0.1, 0.14, woodMat, 3.2, 0.9, -4.64));
    group.add(flat(0.1, 1.9, 0.14, woodMat, 3.2, 1.85, -4.64));
    group.add(block(0.36, 1.9, 0.14, clothMat, 1.7, 1.85, -4.6));
    group.add(block(0.36, 1.9, 0.14, clothMat, 4.7, 1.85, -4.6));

    /* ---- The dinner table: the heart of the room ---- */
    group.add(flat(3.0, 0.11, 1.7, woodMat, 1.4, 0.76, -2.0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        group.add(block(0.12, 0.76, 0.12, legMat, 1.4 + sx * 1.3, 0.38, -2.0 + sz * 0.7));
    }
    group.add(flat(2.8, 0.02, 1.5, sheetMat, 1.4, 0.82, -2.0));
    // Six places set.
    const seats: [number, number, number][] = [
        [0.3, -2.9, 0], [1.4, -2.9, 0], [2.5, -2.9, 0],
        [0.3, -1.1, Math.PI], [1.4, -1.1, Math.PI], [2.5, -1.1, Math.PI],
    ];
    for (const [x, z, yaw] of seats) {
        group.add(chair(darkWood, x, z, yaw));
        const inward = z < -2 ? 0.42 : -0.42;
        // A plate at each place; the glasses are real models.
        group.add(flat(0.3, 0.02, 0.3, sheetMat, x, 0.84, z + inward));
    }
    // Real dishes are placed down the middle by the dressing pass; this keeps a
    // single painted platter so the table never looks bare.
    group.add(block(0.4, 0.14, 0.4, foodMats[3], 2.9, 0.9, -2.0));
    group.add(block(0.14, 0.3, 0.14, lampMat, 2.6, 0.98, -2.0));

    /* ---- Living side: sofa, fireplace, TV, photos ---- */
    group.add(sofa(softMat, -2.6, 2.4, 0, 2.6));
    group.add(sofa(softMat, -4.6, 0.6, Math.PI / 2, 1.7));
    group.add(flat(1.4, 0.08, 0.8, woodMat, -2.6, 0.44, 1.0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        group.add(block(0.07, 0.44, 0.07, legMat, -2.6 + sx * 0.6, 0.22, 1.0 + sz * 0.3));
    }
    group.add(flat(0.32, 0.05, 0.24, books[0], -2.9, 0.5, 1.0));
    group.add(block(0.15, 0.16, 0.15, sheetMat, -2.2, 0.56, 1.0));
    // Fireplace on the left wall with a mantel of photos.
    group.add(block(0.45, 1.5, 2.0, solid(0x6b625a, 0.95), -5.45, 0.75, -1.6));
    group.add(flat(0.3, 0.9, 1.3, solid(0x2a2420, 0.95), -5.18, 0.55, -1.6));
    group.add(flat(0.26, 0.5, 1.1, fireMat, -5.14, 0.38, -1.6));
    group.add(flat(0.6, 0.1, 2.2, woodMat, -5.4, 1.55, -1.6));
    for (let i = 0; i < 4; i++) {
        group.add(flat(0.05, 0.34, 0.26, frameMat, -5.4, 1.77, -2.4 + i * 0.54));
        group.add(flat(0.02, 0.26, 0.19, books[i % books.length], -5.36, 1.77, -2.4 + i * 0.54));
    }
    // TV in the corner.
    group.add(block(0.55, 0.5, 1.7, darkWood, -0.2, 0.25, 4.2));
    group.add(flat(1.5, 0.85, 0.08, frameMat, -0.2, 1.05, 4.35));
    group.add(flat(1.36, 0.72, 0.03, tvMat, -0.2, 1.05, 4.29));
    group.add(shelfUnit(darkWood, books, -4.2, 4.4, 0, 1.9));
    group.add(plant(solid(0x8f6040, 0.9), solid(0x548f56, 0.9), 5.2, 3.6, 1.3));
    group.add(plant(solid(0x8f6040, 0.9), solid(0x4f8552, 0.9), -5.2, 4.5, 0.95));

    /* ---- Kitchen strip on the right ---- */
    group.add(block(3.4, 0.9, 0.85, solid(0x8a7a66, 0.9), 4.0, 0.45, 1.0));
    group.add(flat(3.5, 0.1, 0.95, woodMat, 4.0, 0.95, 1.0));
    group.add(flat(0.6, 0.06, 0.45, metalMat, 3.2, 1.0, 1.0));
    group.add(block(0.1, 0.32, 0.1, metalMat, 3.2, 1.16, 0.75));
    group.add(block(0.85, 1.85, 0.75, metalMat, 5.3, 0.92, -0.5));
    group.add(flat(0.03, 0.65, 0.06, frameMat, 4.86, 1.25, -0.5));
    // Wall cupboards + a kettle.
    group.add(block(3.2, 0.75, 0.4, woodMat, 4.0, 1.85, 1.35));
    group.add(block(0.24, 0.3, 0.24, metalMat, 4.9, 1.1, 1.0));
    group.add(block(0.3, 0.26, 0.3, foodMats[3], 3.6, 1.08, 1.15));

    // Ceiling light.
    group.add(flat(0.06, 0.5, 0.06, frameMat, 0.8, 2.75, 0.2));
    group.add(flat(0.7, 0.28, 0.7, glow(0xffe0b0, 0.55), 0.8, 2.4, 0.2));

    const roomLight = new THREE.PointLight(0xffd0a0, 5.5, 11, 2);
    roomLight.position.set(0.8, 2.3, 0.2);
    group.add(roomLight);
    const tableLight = new THREE.PointLight(0xffc890, 3.4, 7, 2);
    tableLight.position.set(1.4, 1.9, -2.0);
    group.add(tableLight);
    const fireLight = new THREE.PointLight(0xff7a3a, 2.6, 7, 2);
    fireLight.position.set(-5.0, 0.7, -1.6);
    group.add(fireLight);

    // The Sunday-dinner payoff: extra warmth and a set-out cake appear when
    // family bond is high; when it is low the room is emptier and cooler.
    const warmDressing = new THREE.Group();
    warmDressing.add(block(0.6, 0.24, 0.6, sheetMat, 1.4, 0.95, -1.3));
    warmDressing.add(block(0.5, 0.14, 0.5, foodMats[2], 1.4, 1.13, -1.3));
    warmDressing.add(plant(solid(0x8f6040, 0.9), solid(0xc76b8a, 0.9), 0.0, -4.2, 0.8));
    warmDressing.visible = false;
    group.add(warmDressing);

    return {
        group,
        setMood({ night, burnout }) {
            const grime = burnout / 100;
            roomLight.intensity = (5.5 - night * 1.2) * (1 - grime * 0.35);
            tableLight.intensity = 3.4 + night * 0.9;
            fireLight.intensity = 2.6 + night * 1.1;
            fireMat.emissiveIntensity = 1.1 + Math.sin(Date.now() * 0.004) * 0.14 + night * 0.3;
            lampMat.emissiveIntensity = 1.3 * (1 - grime * 0.3);
            tvMat.emissiveIntensity = 0.4 + night * 0.35;
            skyMat.color.setHex(0x5a7a96).lerp(new THREE.Color(0x121a2a), night);
            gardenMat.color.setHex(0x4f7a4a).lerp(new THREE.Color(0x1e2c22), night * 0.85);
            floorMat.color.setHex(0x6b5340).lerp(new THREE.Color(0x4a3a2e), grime * 0.4);
        },
        setPromoted(on) {
            // Reused as "you kept the promise" dressing (see world.ts).
            warmDressing.visible = on;
        },
        setClutter() { /* your family's house does not carry your burnout */ },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}

/* --------------------------- PUBLISHER OFFICE ---------------------------- */

export function createPublisher(offsetX: number): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const floorMat = solid(0x2b2f38, 0.4, 0.3);
    const inlayMat = solid(0x353b46, 0.35, 0.35);
    const wallMat = solid(0x353a45, 0.9);
    const trimMat = solid(0x9aa3b2, 0.35, 0.6);
    const tableMat = solid(0x1f232b, 0.3, 0.4);
    const legMat = solid(0x8f98a8, 0.3, 0.75);
    const chairMat = solid(0x22262f, 0.7);
    const accentMat = solid(0x4a5568, 0.6);
    const paperMat = solid(0xf4f1e8, 0.95);
    const books = [solid(0x50607a, 0.8), solid(0x6a5a7a, 0.8), solid(0x4a6a66, 0.8), solid(0x7a6a4a, 0.8)];

    const screenMat = glow(0xa8d8ff, 0.9);
    const stripMat = glow(0xeaf4ff, 0.7);
    const logoMat = glow(0x7fd8ff, 1.1);
    const skyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x1f2c42 }));
    const cityMat = glow(0xcfe4ff, 0.7);
    const glassMat = trackMat(new THREE.MeshStandardMaterial({
        color: 0xbfe4f5, transparent: true, opacity: 0.13, roughness: 0.05, metalness: 0.3,
    }));

    // Polished floor with an inlay border.
    group.add(block(12, 0.3, 9, floorMat, 0, -0.15, 0));
    group.add(flat(9.4, 0.02, 6.4, inlayMat, 0, 0.008, -0.2));
    group.add(block(12, 3.3, 0.25, wallMat, 0, 1.65, -4.6));
    group.add(block(0.25, 3.3, 9, wallMat, -6.0, 1.65, 0));
    group.add(flat(12, 0.1, 0.3, trimMat, 0, 0.05, -4.55));
    group.add(flat(12, 0.1, 0.3, trimMat, 0, 3.26, -4.6));

    /* ---- Floor-to-ceiling glazing along the back wall ---- */
    group.add(flat(11.4, 2.9, 0.04, skyMat, 0, 1.6, -4.46));
    // Low far silhouette; the real towers are placed outside by the dressing.
    const heights = [0.9, 1.3, 1.0, 1.5, 0.95];
    heights.forEach((h, i) => {
        group.add(flat(0.42, h, 0.04, cityMat, -4.4 + i * 2.2, 0.35 + h / 2, -4.43));
    });
    for (let i = 0; i <= 6; i++) {
        group.add(flat(0.1, 2.9, 0.12, trimMat, -5.7 + i * 1.9, 1.6, -4.38));
    }
    group.add(flat(11.4, 0.12, 0.14, trimMat, 0, 3.06, -4.38));
    group.add(flat(11.4, 0.12, 0.14, trimMat, 0, 0.16, -4.38));

    /* ---- The long review table ---- */
    group.add(flat(5.6, 0.14, 1.9, tableMat, 0, 0.78, -1.2));
    group.add(block(0.5, 0.78, 1.2, legMat, -2.2, 0.39, -1.2));
    group.add(block(0.5, 0.78, 1.2, legMat, 2.2, 0.39, -1.2));
    // Eight seats: their side and yours.
    for (let i = 0; i < 4; i++) {
        const x = -1.95 + i * 1.3;
        group.add(chair(chairMat, x, -2.4, 0));
        group.add(chair(chairMat, x, 0.0, Math.PI));
        group.add(flat(0.3, 0.015, 0.22, paperMat, x, 0.86, -1.65));
        group.add(flat(0.3, 0.015, 0.22, paperMat, x, 0.86, -0.75));
    }
    // Centre console + mic pucks.
    group.add(flat(3.0, 0.05, 0.3, accentMat, 0, 0.86, -1.2));
    for (const x of [-1.0, 0, 1.0]) {
        group.add(block(0.16, 0.07, 0.16, legMat, x, 0.9, -1.2));
    }

    /* ---- Presentation wall on the left ---- */
    group.add(flat(0.1, 1.9, 3.4, accentMat, -5.85, 1.7, -1.4));
    group.add(flat(0.03, 1.7, 3.1, screenMat, -5.78, 1.7, -1.4));
    group.add(flat(0.1, 0.7, 0.7, logoMat, -5.85, 2.55, 1.4));

    /* ---- Reception + waiting area at the front ---- */
    group.add(block(3.0, 1.1, 0.8, tableMat, -3.4, 0.55, 3.2));
    group.add(flat(3.2, 0.1, 0.95, accentMat, -3.4, 1.15, 3.2));
    group.add(flat(1.4, 0.5, 0.06, logoMat, -3.4, 1.9, 3.55));
    group.add(chair(chairMat, -3.4, 4.1, Math.PI));
    group.add(sofa(accentMat, 1.6, 3.4, 0, 2.4));
    group.add(sofa(accentMat, 4.6, 2.2, -Math.PI / 2, 1.9));
    group.add(flat(1.2, 0.06, 0.8, tableMat, 1.6, 0.42, 2.1));
    for (let i = 0; i < 3; i++) {
        group.add(flat(0.28, 0.02, 0.2, paperMat, 1.3 + i * 0.3, 0.46, 2.1));
    }
    group.add(plant(solid(0x3f4652, 0.7), solid(0x4a7f58, 0.9), 5.4, 4.2, 1.4));
    group.add(plant(solid(0x3f4652, 0.7), solid(0x4a7f58, 0.9), -5.4, 2.0, 1.2));

    // Glass partition separating reception from the boardroom.
    group.add(flat(0.08, 2.6, 3.2, glassMat, -0.6, 1.3, 3.0));
    group.add(flat(0.14, 0.1, 3.2, trimMat, -0.6, 2.65, 3.0));

    // Awards shelf + framed posters.
    group.add(shelfUnit(accentMat, books, 3.0, -4.3, 0, 1.8));
    for (const z of [0.4, 2.0]) {
        group.add(flat(0.07, 1.0, 1.4, accentMat, -5.9, 1.55, z));
        group.add(flat(0.03, 0.84, 1.2, books[z > 1 ? 1 : 2], -5.84, 1.55, z));
    }

    // Cool recessed ceiling light.
    for (const z of [-3.0, -0.4, 2.2]) {
        group.add(flat(10.0, 0.08, 0.36, stripMat, 0, 3.12, z));
    }

    const roomLight = new THREE.PointLight(0xdff0ff, 4.4, 13, 2);
    roomLight.position.set(0, 2.7, -1.0);
    group.add(roomLight);
    const screenLight = new THREE.PointLight(0x9fd4ff, 2.6, 8, 2);
    screenLight.position.set(-5.2, 1.7, -1.4);
    group.add(screenLight);
    const receptionLight = new THREE.PointLight(0xe4f0ff, 2.0, 8, 2);
    receptionLight.position.set(-3.0, 2.3, 3.2);
    group.add(receptionLight);

    return {
        group,
        setMood({ night }) {
            stripMat.emissiveIntensity = 0.6 + night * 0.5;
            screenMat.emissiveIntensity = 0.8 + night * 0.5;
            logoMat.emissiveIntensity = 1.0 + night * 0.4;
            cityMat.emissiveIntensity = 0.4 + night * 1.2;
            roomLight.intensity = 4.4 + night * 1.0;
            screenLight.intensity = 2.6 + night * 0.8;
            receptionLight.intensity = 2.0 + night * 0.6;
            skyMat.color.setHex(0x476b96).lerp(new THREE.Color(0x0d1424), night);
        },
        setPromoted() { /* not affected */ },
        setClutter() { /* immaculate, always */ },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}
