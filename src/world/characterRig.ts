/**
 * Procedural low-poly humanoid rig: hierarchical groups (hips -> thighs -> shins,
 * shoulders -> arms, torso -> head) driven by animation cycles, so every
 * character can walk, idle, sit, type, review a screen or shift nervously with
 * no model files at all.
 */
import * as THREE from 'three';

export type Pose = 'idle' | 'walk' | 'sit' | 'type' | 'review' | 'shift';

export interface CharacterLook {
    skin: number;
    hair: number;
    shirt: number;
    trousers: number;
    height?: number;
}

export interface Rig {
    group: THREE.Group;
    setPose(pose: Pose): void;
    getPose(): Pose;
    faceTowards(point: THREE.Vector3 | null): void;
    setYaw(yaw: number): void;
    setSpeedScale(scale: number): void;
    update(dt: number): void;
    dispose(): void;
}

export function createRig(look: CharacterLook): Rig {
    const group = new THREE.Group();
    group.scale.setScalar(look.height ?? 1);

    const matSkin = new THREE.MeshStandardMaterial({ color: look.skin, roughness: 0.62 });
    const matHair = new THREE.MeshStandardMaterial({ color: look.hair, roughness: 0.88 });
    const matShirt = new THREE.MeshStandardMaterial({ color: look.shirt, roughness: 0.72 });
    const matTrousers = new THREE.MeshStandardMaterial({ color: look.trousers, roughness: 0.8 });
    const matShoe = new THREE.MeshStandardMaterial({ color: 0x25262c, roughness: 0.55 });
    const matEye = new THREE.MeshStandardMaterial({ color: 0x1b1a20, roughness: 0.35 });
    const materials = [matSkin, matHair, matShirt, matTrousers, matShoe, matEye];

    /** A rounded box reads far softer than a hard cube at this camera distance. */
    const soft = (
        w: number, h: number, d: number, mat: THREE.Material,
        x = 0, y = 0, z = 0, radius = 0.045
    ) => {
        const r = Math.min(radius, w / 2.2, h / 2.2, d / 2.2);
        const geo = new THREE.BoxGeometry(w - r * 2, h - r * 2, d - r * 2, 2, 2, 2);
        // Push the corners outward so the silhouette is gently bevelled.
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const vz = pos.getZ(i);
            const len = Math.hypot(vx, vy, vz) || 1;
            pos.setXYZ(i, vx + (vx / len) * r, vy + (vy / len) * r, vz + (vz / len) * r);
        }
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        return mesh;
    };

    const body = new THREE.Group();
    body.position.y = 0.9;
    group.add(body);

    // Torso: tapered, with a collar so shirts read as clothing.
    body.add(soft(0.44, 0.58, 0.25, matShirt, 0, 0.05, 0, 0.07));
    body.add(soft(0.46, 0.1, 0.27, matShirt, 0, 0.3, 0, 0.05));
    body.add(soft(0.12, 0.11, 0.12, matSkin, 0, 0.4, 0, 0.04));

    const headPivot = new THREE.Group();
    headPivot.position.y = 0.55;
    body.add(headPivot);
    // Head: slightly egg-shaped, with hair that wraps the skull.
    headPivot.add(soft(0.29, 0.31, 0.27, matSkin, 0, 0, 0, 0.09));
    headPivot.add(soft(0.31, 0.15, 0.29, matHair, 0, 0.13, -0.005, 0.07));
    headPivot.add(soft(0.32, 0.12, 0.1, matHair, 0, 0.05, -0.1, 0.05));
    // Eyes, which do a surprising amount of work for character.
    headPivot.add(soft(0.045, 0.05, 0.03, matEye, -0.07, 0.01, 0.135, 0.015));
    headPivot.add(soft(0.045, 0.05, 0.03, matEye, 0.07, 0.01, 0.135, 0.015));

    const makeArm = (side: number) => {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.28, 0.26, 0);
        body.add(shoulder);
        shoulder.add(soft(0.115, 0.32, 0.125, matShirt, 0, -0.16, 0, 0.05));
        const elbow = new THREE.Group();
        elbow.position.y = -0.32;
        shoulder.add(elbow);
        elbow.add(soft(0.1, 0.28, 0.11, matSkin, 0, -0.14, 0, 0.045));
        // A hand, so gestures have something to end in.
        elbow.add(soft(0.11, 0.12, 0.115, matSkin, 0, -0.31, 0, 0.05));
        return { shoulder, elbow };
    };
    const armL = makeArm(-1);
    const armR = makeArm(1);

    const makeLeg = (side: number) => {
        const hip = new THREE.Group();
        hip.position.set(side * 0.12, -0.28, 0);
        body.add(hip);
        hip.add(soft(0.155, 0.38, 0.175, matTrousers, 0, -0.19, 0, 0.055));
        const knee = new THREE.Group();
        knee.position.y = -0.38;
        hip.add(knee);
        knee.add(soft(0.14, 0.36, 0.16, matTrousers, 0, -0.18, 0, 0.05));
        knee.add(soft(0.155, 0.1, 0.27, matShoe, 0, -0.35, 0.055, 0.04));
        return { hip, knee };
    };
    const legL = makeLeg(-1);
    const legR = makeLeg(1);

    let pose: Pose = 'idle';
    let phase = Math.random() * 6;
    let speedScale = 1;
    let targetYaw = 0;
    let seatBlend = 0;

    return {
        group,
        getPose: () => pose,
        setPose(next) {
            if (pose === next) return;
            pose = next;
            if (next !== 'walk') phase = 0;
        },
        faceTowards(point) {
            if (!point) return;
            const dx = point.x - group.position.x;
            const dz = point.z - group.position.z;
            if (Math.abs(dx) < 0.0005 && Math.abs(dz) < 0.0005) return;
            targetYaw = Math.atan2(dx, dz);
        },
        setYaw(yaw) {
            targetYaw = yaw;
            group.rotation.y = yaw;
        },
        setSpeedScale(s) {
            speedScale = s;
        },
        update(dt) {
            const seated = pose === 'sit' || pose === 'type';
            seatBlend += ((seated ? 1 : 0) - seatBlend) * Math.min(1, dt * 8);
            phase += dt * (pose === 'walk' ? 7.4 * speedScale : 1.7);

            let diff = targetYaw - group.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            group.rotation.y += diff * Math.min(1, dt * 7);

            const swing = Math.sin(phase);
            body.position.y = 0.9 - seatBlend * 0.36;
            body.rotation.x = 0;
            body.rotation.z = 0;
            body.rotation.y = 0;
            headPivot.rotation.x = 0;
            group.rotation.z = 0;

            if (pose === 'walk') {
                legL.hip.rotation.x = swing * 0.62;
                legR.hip.rotation.x = -swing * 0.62;
                legL.knee.rotation.x = Math.max(0, -swing) * 0.5;
                legR.knee.rotation.x = Math.max(0, swing) * 0.5;
                armL.shoulder.rotation.x = -swing * 0.5;
                armR.shoulder.rotation.x = swing * 0.5;
                armL.elbow.rotation.x = -0.25;
                armR.elbow.rotation.x = -0.25;
                body.position.y += Math.abs(Math.sin(phase * 2)) * 0.045;
                body.rotation.z = swing * 0.03;
            } else if (seated) {
                legL.hip.rotation.x = -1.42;
                legR.hip.rotation.x = -1.42;
                legL.knee.rotation.x = 1.42;
                legR.knee.rotation.x = 1.42;
                const typing = pose === 'type' ? 1 : 0;
                armL.shoulder.rotation.x = -0.9 - typing * 0.35;
                armR.shoulder.rotation.x = -0.9 - typing * 0.35;
                armL.elbow.rotation.x = -0.7 + Math.sin(phase * 6) * 0.12 * typing;
                armR.elbow.rotation.x = -0.7 + Math.sin(phase * 6 + 1.4) * 0.12 * typing;
                body.rotation.x = 0.12 + typing * 0.05;
                headPivot.rotation.x = 0.1 + Math.sin(phase * 0.7) * 0.03;
            } else if (pose === 'review') {
                legL.hip.rotation.x = 0.06;
                legR.hip.rotation.x = -0.06;
                legL.knee.rotation.x = 0;
                legR.knee.rotation.x = 0;
                armR.shoulder.rotation.x = -1.05 + Math.sin(phase * 0.8) * 0.15;
                armR.elbow.rotation.x = -0.55;
                armL.shoulder.rotation.x = -0.12;
                armL.elbow.rotation.x = -0.45;
                body.rotation.y = Math.sin(phase * 0.4) * 0.08;
                headPivot.rotation.x = 0.12 + Math.sin(phase * 0.9) * 0.05;
            } else if (pose === 'shift') {
                const w = Math.sin(phase * 0.6);
                legL.hip.rotation.x = 0.05 + w * 0.06;
                legR.hip.rotation.x = -0.05 - w * 0.06;
                legL.knee.rotation.x = 0.05;
                legR.knee.rotation.x = 0.05;
                armL.shoulder.rotation.x = -0.55;
                armR.shoulder.rotation.x = -0.55;
                armL.elbow.rotation.x = -1.1;
                armR.elbow.rotation.x = -1.1;
                group.rotation.z = w * 0.02;
                headPivot.rotation.x = 0.16 + Math.sin(phase * 1.3) * 0.04;
            } else {
                legL.hip.rotation.x = 0;
                legR.hip.rotation.x = 0;
                legL.knee.rotation.x = 0;
                legR.knee.rotation.x = 0;
                armL.shoulder.rotation.x = Math.sin(phase * 0.9) * 0.05;
                armR.shoulder.rotation.x = -Math.sin(phase * 0.9) * 0.05;
                armL.elbow.rotation.x = -0.2;
                armR.elbow.rotation.x = -0.2;
                body.position.y += Math.sin(phase * 1.4) * 0.012;
            }
        },
        dispose() {
            group.traverse((obj) => {
                const mesh = obj as THREE.Mesh;
                if (mesh.geometry) mesh.geometry.dispose();
            });
            for (const m of materials) m.dispose();
        },
    };
}
