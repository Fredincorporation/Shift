/**
 * Episode 2 locations: the Northlight roof (where people go to breathe) and the
 * Fairhaven walk-in clinic (twenty minutes for yourself).
 */
import * as THREE from 'three';
import {
    block, chair, flat, glow, plant, shelfUnit, sofa, solid, trackMat, type Diorama,
} from './diorama.ts';

/* ------------------------------- ROOFTOP --------------------------------- */

export function createRooftop(offsetX: number): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const deckMat = solid(0x4a4a52, 0.95);
    const gravelMat = solid(0x565660, 1);
    const wallMat = solid(0x3f4048, 0.95);
    const railMat = solid(0x74798a, 0.4, 0.6);
    const ductMat = solid(0x6b7180, 0.5, 0.5);
    const woodMat = solid(0x8a6f4a, 0.8);
    const legMat = solid(0x3a3a42, 0.6);
    const crateMat = solid(0x9a8560, 0.9);
    const potMat = solid(0x7a5a44, 0.9);
    const leafMat = solid(0x4f7f52, 0.9);
    const brickMat = solid(0x4f4148, 0.95);

    const bulbMat = glow(0xffcf8a, 1.3);
    const exitMat = glow(0x6fe0a0, 1.0);
    const skyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x1a2438 }));
    const cityMat = glow(0xffd79a, 0.9);
    const beaconMat = glow(0xff5f5f, 1.1);

    // Deck.
    group.add(block(11, 0.3, 9.4, deckMat, 0, -0.15, 0));
    for (let i = -5; i <= 5; i++) {
        group.add(flat(0.06, 0.02, 9.4, gravelMat, i, 0.006, 0));
    }
    // A raised decked area with the bench on it.
    group.add(flat(4.2, 0.12, 3.2, woodMat, -3.0, 0.06, 1.6));

    // Parapet walls all the way round, low enough to see over.
    group.add(block(11, 1.0, 0.3, wallMat, 0, 0.5, -4.7));
    group.add(block(0.3, 1.0, 9.4, wallMat, -5.5, 0.5, 0));
    group.add(block(0.3, 1.0, 9.4, wallMat, 5.5, 0.5, 0));
    group.add(block(11, 1.0, 0.3, wallMat, 0, 0.5, 4.7));
    // Coping stones + a safety rail along the front edge.
    group.add(flat(11, 0.12, 0.42, railMat, 0, 1.05, -4.7));
    group.add(flat(0.42, 0.12, 9.4, railMat, -5.5, 1.05, 0));
    group.add(flat(0.42, 0.12, 9.4, railMat, 5.5, 1.05, 0));
    group.add(flat(11, 0.12, 0.42, railMat, 0, 1.05, 4.7));
    for (let i = -4; i <= 4; i++) {
        group.add(block(0.07, 0.5, 0.07, railMat, i * 1.2, 1.3, -4.62));
    }
    group.add(flat(11, 0.08, 0.1, railMat, 0, 1.56, -4.62));

    /* ---- The city, seen from above ---- */
    // A big backdrop plane far behind. Real building models are placed in front
    // of it by the dressing pass; these thin filler towers sit further out to
    // fill the horizon on either side.
    const backdrop = flat(34, 15, 0.05, skyMat, 0, 5.5, -15);
    group.add(backdrop);
    const towers: [number, number, number, number][] = [
        [-14.5, 6.2, -13.4, 2.2], [-11.5, 8.0, -14.0, 2.4],
        [14.5, 6.6, -13.4, 2.2], [17.0, 7.4, -14.0, 2.4],
    ];
    for (const [x, h, z, w] of towers) {
        group.add(flat(w, h, 0.6, brickMat, x, h / 2, z));
        const cols = Math.max(2, Math.round(w / 0.55));
        const rows = Math.max(3, Math.round(h / 0.9));
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if ((c + r) % 3 === 0) continue;
                group.add(flat(0.2, 0.28, 0.04, cityMat, x - w / 2 + 0.3 + c * (w / cols), 0.6 + r * (h / rows), z + 0.32));
            }
        }
        if (h > 7) group.add(flat(0.16, 0.16, 0.16, beaconMat, x, h + 0.2, z + 0.3));
    }

    /* ---- Roof plant: ducts, vents, aircon, satellite ---- */
    group.add(block(2.6, 1.2, 1.3, ductMat, 3.4, 0.6, -3.0));
    group.add(flat(2.7, 0.14, 1.4, railMat, 3.4, 1.24, -3.0));
    group.add(block(0.5, 0.9, 0.5, ductMat, 4.9, 0.45, -1.2));
    group.add(block(0.7, 0.35, 0.7, ductMat, 4.9, 1.05, -1.2));
    // Long duct run.
    group.add(block(0.85, 0.85, 4.4, ductMat, -4.4, 0.42, -2.2));
    group.add(block(0.95, 0.16, 0.95, railMat, -4.4, 0.9, -3.8));
    group.add(block(0.95, 0.16, 0.95, railMat, -4.4, 0.9, -0.8));
    // Vent stacks.
    for (const [x, z] of [[1.6, -4.0], [-1.0, -4.1], [2.4, 2.6]] as const) {
        group.add(block(0.34, 0.7, 0.34, ductMat, x, 0.35, z));
        group.add(block(0.5, 0.14, 0.5, railMat, x, 0.76, z));
    }
    // Satellite dish.
    group.add(block(0.14, 0.9, 0.14, railMat, 5.0, 0.45, 2.4));
    const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4),
        solid(0xc6c9d2, 0.5, 0.3)
    );
    dish.position.set(5.0, 1.1, 2.4);
    dish.rotation.x = -0.7;
    dish.castShadow = true;
    group.add(dish);

    /* ---- Stairwell head-house with the door in ---- */
    group.add(block(2.2, 2.4, 2.0, wallMat, 4.2, 1.2, 3.6));
    group.add(flat(2.3, 0.14, 2.1, railMat, 4.2, 2.44, 3.6));
    group.add(flat(0.9, 1.8, 0.08, solid(0x2f3138, 0.7), 3.6, 0.9, 2.58));
    group.add(flat(0.44, 0.18, 0.06, exitMat, 3.6, 2.05, 2.55));
    group.add(block(0.08, 0.3, 0.08, railMat, 3.95, 0.95, 2.52));

    /* ---- Where people actually sit ---- */
    // Bench on the decking.
    group.add(flat(2.4, 0.1, 0.55, woodMat, -3.4, 0.52, 1.8));
    group.add(flat(2.4, 0.6, 0.1, woodMat, -3.4, 0.82, 1.5));
    for (const sx of [-1, 1]) {
        group.add(block(0.12, 0.42, 0.5, legMat, -3.4 + sx * 1.0, 0.27, 1.8));
    }
    // A couple of crates people use as stools, and a full ashtray.
    group.add(block(0.6, 0.6, 0.6, crateMat, -1.2, 0.42, 2.4));
    group.add(block(0.55, 0.55, 0.55, crateMat, -0.4, 0.4, 3.2));
    group.add(flat(0.3, 0.08, 0.3, railMat, -1.2, 0.76, 2.4));
    // Camping chairs and a folding table by the edge.
    group.add(chair(solid(0x4a5f6b, 0.9), 1.2, 1.4, Math.PI * 0.9));
    group.add(chair(solid(0x5f4a5f, 0.9), 2.2, 0.6, -Math.PI * 0.7));
    group.add(flat(0.85, 0.06, 0.85, woodMat, 1.7, 0.7, 0.9));
    group.add(block(0.1, 0.7, 0.1, legMat, 1.7, 0.35, 0.9));
    // Real cups and cans are placed here by the dressing pass.

    // Somebody's tomato plants in buckets — a small act of hope.
    group.add(plant(potMat, leafMat, -5.0, 3.6, 1.2));
    group.add(plant(potMat, leafMat, -4.2, 4.0, 0.95));
    group.add(plant(potMat, leafMat, 0.6, 4.2, 1.05));
    group.add(shelfUnit(woodMat, [solid(0x7a5f4a, 0.9), solid(0x4f6f7a, 0.9)], -5.0, -0.2, Math.PI / 2, 1.1));

    // Festoon bulbs strung between the head-house and the parapet.
    for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = 3.3 - t * 8.0;
        const sag = Math.sin(t * Math.PI) * 0.42;
        group.add(flat(0.05, 0.05, 0.9, legMat, x, 2.35 - sag, 2.2 - t * 0.5));
        group.add(flat(0.16, 0.2, 0.16, bulbMat, x, 2.16 - sag, 2.2 - t * 0.5));
    }

    const stringLight = new THREE.PointLight(0xffbe78, 3.2, 10, 2);
    stringLight.position.set(-0.5, 2.2, 1.8);
    group.add(stringLight);
    const doorLight = new THREE.PointLight(0x8fe8b8, 1.4, 5, 2);
    doorLight.position.set(3.6, 2.0, 2.4);
    group.add(doorLight);
    const cityGlow = new THREE.PointLight(0x9fb6ff, 1.6, 16, 2);
    cityGlow.position.set(0, 3.0, -6.0);
    group.add(cityGlow);

    // Crunch clutter: more cups, more cigarette ends, an abandoned laptop.
    const clutter: THREE.Object3D[] = [];
    const cupMat = solid(0xe4ded1, 0.9);
    const specs: [number, number, number, number, number, number, THREE.Material][] = [
        [0.14, 0.18, 0.14, -3.0, 0.61, 1.8, cupMat],
        [0.14, 0.18, 0.14, -3.8, 0.61, 1.8, cupMat],
        [0.14, 0.18, 0.14, -1.2, 0.85, 2.4, cupMat],
        [0.14, 0.18, 0.14, 2.05, 0.79, 0.95, cupMat],
        [0.42, 0.05, 0.3, 1.5, 0.76, 0.75, solid(0x2f3138, 0.6)],
        [0.5, 0.14, 0.5, -0.4, 0.72, 3.2, crateMat],
        [0.34, 0.1, 0.26, 0.4, 0.05, 1.2, cupMat],
    ];
    for (const [w, h, d, x, y, z, mat] of specs) {
        const item = block(w, h, d, mat, x, y, z);
        item.visible = false;
        clutter.push(item);
        group.add(item);
    }

    return {
        group,
        setMood({ night, burnout }) {
            const grime = burnout / 100;
            // The roof is a night-and-dusk place; the city carries the light.
            bulbMat.emissiveIntensity = 1.1 + night * 0.5;
            cityMat.emissiveIntensity = 0.4 + night * 1.3;
            exitMat.emissiveIntensity = 0.8 + night * 0.4;
            beaconMat.emissiveIntensity = 0.8 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.9;
            stringLight.intensity = 3.2 + night * 1.4;
            doorLight.intensity = 1.4 + night * 0.5;
            cityGlow.intensity = 1.6 + night * 1.6;
            skyMat.color.setHex(0x3d5378).lerp(new THREE.Color(0x080d18), night);
            deckMat.color.setHex(0x4a4a52).lerp(new THREE.Color(0x333338), grime * 0.5);
        },
        setPromoted() { /* no promotion dressing up here */ },
        setClutter(level) {
            const shown = Math.floor(Math.max(0, Math.min(1, (level - 30) / 55)) * clutter.length);
            clutter.forEach((c, i) => { c.visible = i < shown; });
        },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}

/* -------------------------------- CLINIC --------------------------------- */

export function createClinic(offsetX: number): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const floorMat = solid(0xa8a49c, 0.6, 0.1);
    const inlayMat = solid(0x9a968e, 0.6);
    const wallMat = solid(0xc4c8c2, 0.95);
    const lowerWallMat = solid(0x8fa89f, 0.9);
    const trimMat = solid(0xdfe2dc, 0.8);
    const seatMat = solid(0x4f7f8a, 0.85);
    const woodMat = solid(0xb59a72, 0.75);
    const deskMat = solid(0xe4e0d6, 0.7);
    const metalMat = solid(0xb4b8c0, 0.35, 0.65);
    const curtainMat = solid(0x7aa8a0, 0.95);
    const paperMat = solid(0xf6f4ee, 0.95);
    const bedMat = solid(0xdce4e2, 0.9);
    const books = [solid(0x6f8a9a, 0.9), solid(0x8a7f6f, 0.9), solid(0x7a8a6f, 0.9)];

    const stripMat = glow(0xf2f8ff, 0.8);
    const screenMat = glow(0xa8d8c0, 0.7);
    const signMat = glow(0x8fd8b8, 0.9);
    const skyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x9fb4c8 }));

    // Hard clinical floor with a coloured wayfinding stripe.
    group.add(block(11, 0.3, 8.6, floorMat, 0, -0.15, 0));
    group.add(flat(11, 0.02, 0.5, inlayMat, 0, 0.008, -0.6));
    group.add(flat(10.4, 0.02, 0.16, signMat, 0, 0.012, -0.6));

    group.add(block(11, 3.0, 0.25, wallMat, 0, 1.5, -4.4));
    group.add(block(0.25, 3.0, 8.6, wallMat, -5.5, 1.5, 0));
    // Scrubbable lower wall panel.
    group.add(flat(11, 1.1, 0.28, lowerWallMat, 0, 0.55, -4.36));
    group.add(flat(0.28, 1.1, 8.6, lowerWallMat, -5.46, 0.55, 0));
    group.add(flat(11, 0.09, 0.32, trimMat, 0, 1.14, -4.34));
    group.add(flat(11, 0.1, 0.3, trimMat, 0, 2.97, -4.4));

    /* ---- Reception desk with a glass screen ---- */
    group.add(block(3.4, 1.1, 0.85, deskMat, -3.2, 0.55, -3.0));
    group.add(flat(3.6, 0.1, 0.95, woodMat, -3.2, 1.15, -3.0));
    group.add(flat(3.4, 0.06, 0.6, deskMat, -3.2, 0.78, -2.75));
    const glassMat = trackMat(new THREE.MeshStandardMaterial({
        color: 0xd8f0f8, transparent: true, opacity: 0.15, roughness: 0.06, metalness: 0.2,
    }));
    group.add(flat(3.4, 0.9, 0.05, glassMat, -3.2, 1.65, -3.0));
    group.add(flat(3.5, 0.08, 0.1, metalMat, -3.2, 2.12, -3.0));
    group.add(flat(0.5, 0.03, 0.36, paperMat, -2.2, 1.2, -2.85));
    group.add(block(0.36, 0.28, 0.3, solid(0x3f434a, 0.6), -4.1, 1.29, -3.05));
    // Queue-number display and a hand-gel dispenser.
    group.add(flat(0.8, 0.44, 0.06, screenMat, -3.2, 2.4, -4.34));
    group.add(block(0.16, 0.32, 0.14, trimMat, -1.4, 1.35, -4.28));

    /* ---- Waiting area ---- */
    // Rows of linked chairs.
    for (let row = 0; row < 2; row++) {
        const z = 1.3 + row * 1.5;
        for (let i = 0; i < 5; i++) {
            const x = -3.6 + i * 1.0;
            group.add(flat(0.82, 0.1, 0.5, seatMat, x, 0.46, z));
            group.add(flat(0.82, 0.55, 0.1, seatMat, x, 0.72, z + 0.24));
            group.add(block(0.07, 0.44, 0.07, metalMat, x - 0.3, 0.23, z));
            group.add(block(0.07, 0.44, 0.07, metalMat, x + 0.3, 0.23, z));
        }
        group.add(flat(5.0, 0.06, 0.06, metalMat, -1.6, 0.42, z - 0.24));
    }
    // Low table with well-thumbed magazines.
    group.add(flat(1.2, 0.07, 0.7, woodMat, 1.8, 0.44, 2.0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        group.add(block(0.06, 0.44, 0.06, metalMat, 1.8 + sx * 0.5, 0.22, 2.0 + sz * 0.26));
    }
    for (let i = 0; i < 3; i++) {
        group.add(flat(0.34, 0.02, 0.24, books[i % books.length], 1.6 + i * 0.22, 0.49 + i * 0.02, 2.0));
    }
    group.add(sofa(seatMat, 4.2, 2.6, -Math.PI / 2, 1.8));
    group.add(plant(solid(0x8f8a80, 0.8), solid(0x5f8a5f, 0.9), 5.0, 0.6, 1.3));
    group.add(plant(solid(0x8f8a80, 0.8), solid(0x5f8a5f, 0.9), -5.0, 3.4, 1.1));
    // Water cooler and a bin.
    group.add(block(0.42, 1.0, 0.42, trimMat, 5.0, 0.5, 3.8));
    group.add(block(0.36, 0.44, 0.36, glow(0xbfe4f5, 0.3), 5.0, 1.22, 3.8));
    group.add(block(0.36, 0.5, 0.36, solid(0x6f7a74, 0.85), -0.6, 0.25, 3.9));

    /* ---- Health posters and notices ---- */
    [-4.4, -2.6, 0.2, 2.0].forEach((z, i) => {
        group.add(flat(0.06, 1.0, 0.74, paperMat, -5.42, 1.75, z));
        group.add(flat(0.03, 0.82, 0.6, books[i % books.length], -5.36, 1.78, z));
    });
    group.add(flat(1.8, 1.1, 0.06, paperMat, 1.4, 1.85, -4.32));
    group.add(flat(1.6, 0.16, 0.03, signMat, 1.4, 2.28, -4.28));

    /* ---- Consulting corner behind a curtain ---- */
    group.add(flat(0.12, 2.3, 3.4, curtainMat, 1.2, 1.15, -2.4));
    group.add(flat(0.12, 0.08, 3.5, metalMat, 1.2, 2.34, -2.4));
    group.add(flat(3.6, 2.3, 0.12, curtainMat, 3.0, 1.15, -0.75));
    group.add(flat(3.7, 0.08, 0.12, metalMat, 3.0, 2.34, -0.75));
    // Examination bed with a paper roll.
    group.add(block(0.9, 0.6, 2.0, metalMat, 4.3, 0.3, -2.4));
    group.add(flat(0.95, 0.2, 2.05, bedMat, 4.3, 0.7, -2.4));
    group.add(flat(0.9, 0.05, 1.9, paperMat, 4.3, 0.81, -2.4));
    group.add(flat(0.6, 0.16, 0.5, bedMat, 4.3, 0.86, -3.2));
    // Doctor's desk, screen, and the stool she rolls about on.
    group.add(flat(1.9, 0.09, 0.9, deskMat, 2.4, 0.76, -3.4));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        group.add(block(0.07, 0.76, 0.07, metalMat, 2.4 + sx * 0.8, 0.38, -3.4 + sz * 0.35));
    }
    group.add(block(0.1, 0.2, 0.1, solid(0x3f434a, 0.6), 2.4, 0.9, -3.6));
    group.add(flat(0.7, 0.42, 0.05, screenMat, 2.4, 1.15, -3.62));
    group.add(flat(0.42, 0.02, 0.16, solid(0x2f3138, 0.6), 2.4, 0.82, -3.15));
    group.add(chair(solid(0x4a5560, 0.8), 2.4, -2.6, 0));
    // Sharps bin, sanitiser, blood-pressure cuff on the wall.
    group.add(block(0.26, 0.34, 0.26, solid(0xd8c24a, 0.85), 3.3, 0.17, -3.9));
    group.add(block(0.14, 0.3, 0.14, trimMat, 1.7, 0.92, -3.75));
    group.add(flat(0.3, 0.4, 0.14, solid(0x5f7a8a, 0.85), 5.36, 1.5, -2.4));

    // Ceiling strip lights, unforgivingly even.
    for (const z of [-3.2, -0.6, 2.0]) {
        group.add(flat(9.4, 0.1, 0.42, stripMat, 0, 2.92, z));
    }
    // A window onto a grey afternoon.
    group.add(flat(3.0, 1.5, 0.05, skyMat, 3.4, 1.75, 4.28));
    group.add(flat(3.1, 0.1, 0.14, trimMat, 3.4, 2.54, 4.24));
    group.add(flat(3.1, 0.1, 0.14, trimMat, 3.4, 0.96, 4.24));
    group.add(flat(0.1, 1.6, 0.14, trimMat, 3.4, 1.75, 4.24));

    const roomLight = new THREE.PointLight(0xeef6ff, 4.6, 14, 2);
    roomLight.position.set(0, 2.6, -0.6);
    group.add(roomLight);
    const deskLight = new THREE.PointLight(0xdff0e8, 1.8, 6, 2);
    deskLight.position.set(2.4, 1.7, -3.2);
    group.add(deskLight);
    const receptionLight = new THREE.PointLight(0xeef6ff, 1.6, 7, 2);
    receptionLight.position.set(-3.2, 2.2, -2.8);
    group.add(receptionLight);

    return {
        group,
        setMood({ night }) {
            // A clinic looks the same at every hour, which is rather the point.
            stripMat.emissiveIntensity = 0.75 + night * 0.15;
            screenMat.emissiveIntensity = 0.6 + night * 0.2;
            signMat.emissiveIntensity = 0.85 + night * 0.2;
            roomLight.intensity = 4.6;
            deskLight.intensity = 1.8;
            receptionLight.intensity = 1.6;
            skyMat.color.setHex(0xa8bccd).lerp(new THREE.Color(0x2a3446), night);
        },
        setPromoted() { /* not affected */ },
        setClutter() { /* wiped down hourly */ },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}
