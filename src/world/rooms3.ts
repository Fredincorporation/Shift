/**
 * Episode 3: St Bride's, Ward 6.
 *
 * A four-bed bay on a night shift. Deliberately restrained — soft light, a lot of
 * empty floor, one bed that matters. The emptiness is the point.
 */
import * as THREE from 'three';
import {
    block, chair, flat, glow, plant, sofa, solid, trackMat, type Diorama,
} from './diorama.ts';

export function createHospital(offsetX: number): Diorama {
    const group = new THREE.Group();
    group.position.x = offsetX;

    const floorMat = solid(0xb8b4a8, 0.55, 0.08);
    const inlayMat = solid(0xa8a49a, 0.6);
    const wallMat = solid(0xd2d6cf, 0.95);
    const lowerMat = solid(0x8fa4a8, 0.9);
    const trimMat = solid(0xe6e9e2, 0.8);
    const bedFrame = solid(0xc8ccd2, 0.35, 0.6);
    const linenMat = solid(0xeef1ee, 0.92);
    const blanketMat = solid(0x7f9aa8, 0.95);
    const woodMat = solid(0xb59a72, 0.75);
    const metalMat = solid(0xaeb4bc, 0.35, 0.65);
    const curtainMat = solid(0x86a8a0, 0.95);
    const paperMat = solid(0xf6f4ee, 0.95);
    const softMat = solid(0x6f7a86, 0.9);
    const cardMats = [solid(0xd88f9a, 0.9), solid(0x8fb4d8, 0.9), solid(0xd8c98f, 0.9)];

    const stripMat = glow(0xeaf4f8, 0.55);
    const monitorMat = glow(0x8fe0b8, 0.9);
    const nightMat = glow(0xffd9a8, 0.7);
    const signMat = glow(0x9fe0c8, 0.85);
    const skyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x121a2a }));
    const cityMat = glow(0xffd79a, 0.8);

    /* ------------------------------- shell -------------------------------- */
    group.add(block(11, 0.3, 9, floorMat, 0, -0.15, 0));
    // A wayfinding stripe down the middle of the floor.
    group.add(flat(11, 0.02, 0.42, inlayMat, 0, 0.008, 1.4));
    group.add(flat(10.4, 0.02, 0.12, signMat, 0, 0.012, 1.4));

    group.add(block(11, 3.1, 0.25, wallMat, 0, 1.55, -4.5));
    group.add(block(0.25, 3.1, 9, wallMat, -5.5, 1.55, 0));
    group.add(flat(11, 1.15, 0.28, lowerMat, 0, 0.57, -4.46));
    group.add(flat(0.28, 1.15, 9, lowerMat, -5.46, 0.57, 0));
    group.add(flat(11, 0.09, 0.32, trimMat, 0, 1.2, -4.44));
    group.add(flat(11, 0.1, 0.3, trimMat, 0, 3.07, -4.5));
    // Handrail along the corridor wall.
    group.add(flat(0.1, 0.09, 9, metalMat, -5.3, 0.92, 0));

    /* ---------------------------- the four beds ---------------------------- */
    /** One bay: bed, cabinet, chair, curtain rail and a light over the pillow. */
    const bay = (x: number, occupied: boolean, isDad = false) => {
        const b = new THREE.Group();
        // Frame and mattress.
        b.add(block(1.05, 0.52, 2.15, bedFrame, 0, 0.26, 0));
        b.add(flat(1.0, 0.22, 2.05, linenMat, 0, 0.62, 0));
        // Head and foot boards.
        b.add(flat(1.08, 0.5, 0.09, bedFrame, 0, 0.6, -1.1));
        b.add(flat(1.08, 0.34, 0.09, bedFrame, 0, 0.52, 1.1));
        // Side rails.
        b.add(flat(0.07, 0.34, 1.5, metalMat, -0.52, 0.85, 0));
        b.add(flat(0.07, 0.34, 1.5, metalMat, 0.52, 0.85, 0));
        if (occupied) {
            // Turned-down blanket and a pillow with someone under it.
            b.add(flat(0.98, 0.16, 1.25, blanketMat, 0, 0.74, 0.34));
            b.add(flat(0.72, 0.16, 0.44, linenMat, 0, 0.78, -0.72));
            b.add(flat(0.42, 0.2, 0.9, linenMat, 0, 0.8, -0.15));
        } else {
            b.add(flat(0.98, 0.1, 1.9, linenMat, 0, 0.72, 0));
        }
        // Bedside cabinet with a water jug and a beaker.
        b.add(block(0.5, 0.7, 0.46, woodMat, 0.86, 0.35, -0.7));
        b.add(block(0.16, 0.22, 0.16, linenMat, 0.86, 0.81, -0.7));
        b.add(block(0.1, 0.12, 0.1, linenMat, 0.86, 0.76, -0.44));
        // Visitor's chair.
        b.add(chair(softMat, 1.5, 0.1, -Math.PI / 2));
        // Curtain rail overhead, curtain pushed back.
        b.add(flat(1.5, 0.07, 0.07, metalMat, 0, 2.3, -1.05));
        b.add(flat(0.24, 1.9, 0.14, curtainMat, -0.66, 1.35, -1.02));
        // Light and call button above the pillow.
        b.add(flat(0.44, 0.12, 0.16, nightMat, 0, 1.55, -1.12));
        b.add(flat(0.14, 0.1, 0.05, signMat, 0.36, 1.2, -1.12));
        if (isDad) {
            // A monitor on a stand, and cards from people who care.
            b.add(block(0.12, 1.2, 0.12, metalMat, -0.78, 0.6, -0.8));
            b.add(flat(0.42, 0.32, 0.1, bedFrame, -0.78, 1.32, -0.8));
            b.add(flat(0.34, 0.24, 0.03, monitorMat, -0.78, 1.32, -0.73));
            cardMats.forEach((mat, i) => {
                b.add(flat(0.16, 0.2, 0.02, mat, 0.72 + i * 0.14, 0.92, -0.62));
            });
            // A drip stand, because it is that kind of ward.
            b.add(block(0.07, 1.5, 0.07, metalMat, -0.62, 0.75, 0.3));
            b.add(flat(0.16, 0.3, 0.16, glow(0xdfe6ea, 0.25), -0.62, 1.62, 0.3));
        }
        b.position.set(x, 0, -1.7);
        return b;
    };

    group.add(bay(-3.6, false));
    group.add(bay(-1.1, true));
    group.add(bay(2.6, true, true));   // your dad
    group.add(bay(4.9, false));

    /* --------------------------- nurses' station -------------------------- */
    group.add(block(2.8, 1.05, 0.8, trimMat, -3.0, 0.52, -3.4));
    group.add(flat(2.9, 0.1, 0.9, woodMat, -3.0, 1.1, -3.4));
    group.add(flat(0.5, 0.03, 0.36, paperMat, -2.4, 1.16, -3.3));
    group.add(block(0.34, 0.26, 0.28, solid(0x3f434a, 0.6), -3.6, 1.28, -3.45));
    group.add(flat(0.5, 0.3, 0.05, monitorMat, -3.6, 1.42, -3.32));
    // A whiteboard of bed numbers, and a clock.
    group.add(flat(1.9, 1.0, 0.06, paperMat, -3.0, 1.95, -4.4));
    for (let i = 0; i < 4; i++) {
        group.add(flat(1.6, 0.03, 0.02, lowerMat, -3.0, 2.3 - i * 0.2, -4.36));
    }
    group.add(flat(0.42, 0.42, 0.06, trimMat, -1.2, 2.2, -4.4));

    /* ------------------------- corridor + waiting -------------------------- */
    group.add(sofa(softMat, -3.4, 2.6, 0, 2.0));
    group.add(flat(1.0, 0.06, 0.6, woodMat, -3.4, 0.42, 1.5));
    group.add(flat(0.28, 0.02, 0.2, paperMat, -3.4, 0.46, 1.5));
    // Vending machine and a hand-gel post.
    group.add(block(0.8, 1.8, 0.6, solid(0x4a5058, 0.8), -5.0, 0.9, 4.0));
    group.add(flat(0.6, 1.0, 0.05, glow(0xa8d8ff, 0.3), -4.62, 1.1, 4.0));
    group.add(block(0.16, 1.1, 0.16, trimMat, -1.8, 0.55, 4.0));
    group.add(block(0.2, 0.24, 0.16, linenMat, -1.8, 1.2, 4.0));
    group.add(plant(solid(0x8f8a80, 0.8), solid(0x5f8a5f, 0.9), 4.8, 3.6, 1.2));
    // Signage, because hospitals are nothing but signage.
    group.add(flat(1.5, 0.3, 0.05, signMat, 1.2, 2.5, -4.44));
    group.add(flat(0.05, 0.28, 1.2, signMat, -5.42, 2.4, 1.0));

    /* ------------------------------ the window ---------------------------- */
    group.add(flat(3.2, 1.7, 0.05, skyMat, 3.6, 1.8, 4.4));
    [0.5, 0.85, 0.6, 1.0].forEach((h, i) => {
        group.add(flat(0.3, h, 0.04, cityMat, 2.5 + i * 0.72, 1.15 + h / 2, 4.37));
    });
    group.add(flat(3.3, 0.1, 0.13, trimMat, 3.6, 2.6, 4.36));
    group.add(flat(3.3, 0.1, 0.13, trimMat, 3.6, 1.0, 4.36));
    group.add(flat(0.1, 1.7, 0.13, trimMat, 3.6, 1.8, 4.36));

    /* ------------------------------- lights -------------------------------- */
    // Night lighting: most strips off, a pool of light at the station.
    for (const z of [-3.0, 0.6]) {
        group.add(flat(9.4, 0.1, 0.36, stripMat, 0, 2.95, z));
    }
    const roomLight = new THREE.PointLight(0xdfeaf0, 2.2, 14, 2);
    roomLight.position.set(0, 2.6, -0.6);
    group.add(roomLight);
    const stationLight = new THREE.PointLight(0xeaf4f8, 2.8, 8, 2);
    stationLight.position.set(-3.0, 2.2, -3.2);
    group.add(stationLight);
    const bedLight = new THREE.PointLight(0xffc890, 1.9, 5.5, 2);
    bedLight.position.set(2.6, 1.7, -2.6);
    group.add(bedLight);
    const monitorLight = new THREE.PointLight(0x8fe0b8, 0.9, 4, 2);
    monitorLight.position.set(1.8, 1.4, -2.5);
    group.add(monitorLight);

    return {
        group,
        setMood({ night }) {
            // A ward at night is dim everywhere except the bed you care about.
            const dim = 0.45 + (1 - night) * 0.55;
            stripMat.emissiveIntensity = 0.28 + (1 - night) * 0.3;
            roomLight.intensity = 2.2 * dim;
            stationLight.intensity = 2.8;
            bedLight.intensity = 1.9 + night * 0.5;
            monitorLight.intensity = 0.9 + night * 0.4;
            monitorMat.emissiveIntensity = 0.8 + night * 0.35;
            nightMat.emissiveIntensity = 0.55 + night * 0.5;
            cityMat.emissiveIntensity = 0.35 + night * 1.1;
            skyMat.color.setHex(0x3a4c6a).lerp(new THREE.Color(0x0a1020), night);
        },
        setPromoted() { /* not affected */ },
        setClutter() { /* cleaned hourly, whatever else is happening */ },
        dispose() { /* pooled geometry freed by disposeDioramaPools */ },
    };
}
