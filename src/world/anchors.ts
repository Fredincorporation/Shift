/**
 * Shared world coordinates. Every location is a diorama placed at its own
 * offset along +X in one scene, so the camera can pan between them and new
 * places can be added without touching anything else.
 */
import * as THREE from 'three';

export type SceneId =
    | 'studio' | 'home' | 'bar' | 'family' | 'publisher' | 'rooftop' | 'clinic'
    | 'hospital';

/** Where each location sits in world space. */
export const OFFSETS: Record<SceneId, number> = {
    studio: 0,
    home: 24,
    bar: 48,
    family: 72,
    publisher: 96,
    rooftop: 120,
    clinic: 144,
    hospital: 168,
};

export interface Anchor {
    /** Where the object/character stands. */
    at: THREE.Vector3;
    /** Where the player stops to interact. */
    approach: THREE.Vector3;
}

export interface LocationInfo {
    id: SceneId;
    name: string;
    subtitle: string;
    /** Story beats in which travelling here is allowed. */
    openIn: string[];
    playerStart: THREE.Vector3;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Local coordinates offset into a location's world position. */
const at = (scene: SceneId, x: number, z: number) => v(OFFSETS[scene] + x, 0, z);

const anchor = (scene: SceneId, x: number, z: number, ax: number, az: number): Anchor => ({
    at: at(scene, x, z),
    approach: at(scene, ax, az),
});

/* ------------------------------- LOCATIONS ------------------------------- */

export const LOCATIONS: Record<SceneId, LocationInfo> = {
    studio: {
        id: 'studio',
        name: 'Northlight Interactive',
        subtitle: 'The studio',
        openIn: [
            'act1_arrival', 'act1_mara', 'act3_collision', 'act3_verdict', 'act4_thursday',
            // Episode 2 reopens the studio.
            'ep2_return', 'ep2_crunch', 'ep2_break', 'ep2_clinic', 'ep2_slice', 'ep2_epilogue',
            'ep3_lead', 'ep3_people', 'ep3_ward', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('studio', 0, 3.2),
    },
    home: {
        id: 'home',
        name: 'Your Apartment',
        subtitle: 'Home',
        openIn: [
            'act2_home', 'act2_call', 'act2_choice', 'act4_friday', 'act4_sunday', 'epilogue',
            'ep2_return', 'ep2_crunch', 'ep2_break', 'ep2_clinic', 'ep2_slice', 'ep2_epilogue',
            'ep3_lead', 'ep3_people', 'ep3_ward', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('home', 0, 1.2),
    },
    bar: {
        id: 'bar',
        name: 'The Lamplighter',
        subtitle: "Priya's bar",
        openIn: [
            'act4_friday', 'epilogue', 'ep2_crunch', 'ep2_break', 'ep2_slice', 'ep2_epilogue',
            'ep3_lead', 'ep3_people', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('bar', -1.0, 3.4),
    },
    family: {
        id: 'family',
        name: "Your Family's House",
        subtitle: 'Sunday',
        openIn: [
            'act4_sunday', 'epilogue', 'ep2_crunch', 'ep2_break', 'ep2_slice', 'ep2_epilogue',
            'ep3_lead', 'ep3_people', 'ep3_ward', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('family', 0.6, 3.8),
    },
    publisher: {
        id: 'publisher',
        name: 'Vantage Publishing',
        subtitle: 'The review',
        openIn: [
            'act4_thursday', 'ep2_slice', 'ep2_epilogue', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('publisher', 1.0, 4.0),
    },
    rooftop: {
        id: 'rooftop',
        name: 'The Northlight Roof',
        subtitle: 'Where people go to breathe',
        openIn: [
            'ep2_return', 'ep2_crunch', 'ep2_break', 'ep2_clinic', 'ep2_slice', 'ep2_epilogue',
            'ep3_lead', 'ep3_people', 'ep3_ward', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('rooftop', -0.4, 3.4),
    },
    clinic: {
        id: 'clinic',
        name: 'Fairhaven Walk-In',
        subtitle: 'Twenty minutes for yourself',
        openIn: [
            'ep2_clinic', 'ep2_slice', 'ep2_epilogue',
            'ep3_lead', 'ep3_people', 'ep3_ward', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('clinic', 0.4, 3.6),
    },
    hospital: {
        id: 'hospital',
        name: 'St Bride\'s, Ward 6',
        subtitle: 'Where your dad is',
        openIn: [
            'ep3_ward', 'ep3_reckoning', 'ep3_epilogue',
            'ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue',
            'ep5_blackout', 'ep5_leak', 'ep5_reckoning', 'ep5_epilogue',
            'ep6_gold', 'ep6_cert', 'ep6_launch_night', 'ep6_epilogue',
            'ep7_aftermath', 'ep7_reckoning', 'ep7_future', 'ep7_epilogue',
        ],
        playerStart: at('hospital', -0.6, 3.6),
    },
};

/* -------------------------------- ANCHORS -------------------------------- */

export const STUDIO = {
    playerStart: LOCATIONS.studio.playerStart,
    jonah: anchor('studio', -3.6, -2.55, -3.6, -2.0),
    mara: anchor('studio', 3.6, -3.5, 3.6, -2.4),
    theo: anchor('studio', -3.6, 2.6, -2.5, 2.2),
    nadia: anchor('studio', -1.4, -3.6, -1.4, -2.4),
    tara: anchor('studio', -5.2, 1.2, -4.2, 1.2),
    laptop: anchor('studio', 0.4, -3.6, 0.4, -2.4),
    coffee: anchor('studio', 5.4, 3.6, 4.3, 2.5),
};

export const HOME = {
    playerStart: LOCATIONS.home.playerStart,
    desk: anchor('home', -2.6, -3.3, -2.6, -2.55),
    phone: anchor('home', 2.6, 3.1, 2.4, 2.2),
    bed: anchor('home', 3.2, -1.6, 0.9, -1.4),
    couch: anchor('home', -2.4, 2.6, -2.4, 0.4),
    window: anchor('home', 0, -4.3, 0, -2.6),
};

export const BAR = {
    playerStart: LOCATIONS.bar.playerStart,
    priya: anchor('bar', -3.1, -0.6, -2.1, -0.6),
    counter: anchor('bar', 2.2, -3.0, 2.2, -1.9),
    jukebox: anchor('bar', 4.7, 0.4, 3.9, 0.4),
    pool: anchor('bar', 3.0, 3.2, 1.6, 2.6),
    window: anchor('bar', -2.2, -4.3, -2.2, -3.3),
};

export const FAMILY = {
    playerStart: LOCATIONS.family.playerStart,
    mum: anchor('family', 1.4, -0.4, 1.4, 0.6),
    sister: anchor('family', -2.6, 2.4, -2.6, 1.0),
    table: anchor('family', 1.4, -2.0, 1.4, -0.5),
    fireplace: anchor('family', -5.0, -1.6, -4.0, -1.6),
    kitchen: anchor('family', 4.0, 1.0, 4.0, 2.2),
};

export const PUBLISHER = {
    playerStart: LOCATIONS.publisher.playerStart,
    mara: anchor('publisher', -0.6, -0.6, -0.6, 0.7),
    exec: anchor('publisher', 0.7, -3.0, 0.7, -2.0),
    table: anchor('publisher', 0, -1.2, -1.6, -0.4),
    screen: anchor('publisher', -5.6, -1.4, -4.6, -1.4),
    reception: anchor('publisher', -3.4, 3.4, -3.4, 4.2),
};

export const ROOFTOP = {
    playerStart: LOCATIONS.rooftop.playerStart,
    theo: anchor('rooftop', -2.6, -1.4, -2.6, -0.3),
    mara: anchor('rooftop', 2.8, -2.2, 2.8, -1.1),
    jonah: anchor('rooftop', 3.0, 1.6, 1.9, 1.6),
    edge: anchor('rooftop', 0.0, -3.9, 0.0, -2.7),
    bench: anchor('rooftop', -3.4, 1.8, -2.3, 1.8),
    door: anchor('rooftop', 4.2, 3.4, 3.1, 3.0),
};

export const HOSPITAL = {
    playerStart: LOCATIONS.hospital.playerStart,
    dad: anchor('hospital', 2.6, -1.7, 1.4, -1.7),
    mum: anchor('hospital', 0.6, -0.6, 0.6, 0.5),
    nurse: anchor('hospital', -2.8, -2.6, -2.8, -1.5),
    window: anchor('hospital', 4.2, -3.6, 3.2, -3.0),
    corridor: anchor('hospital', -3.4, 3.0, -3.4, 2.0),
};

export const CLINIC = {
    playerStart: LOCATIONS.clinic.playerStart,
    doctor: anchor('clinic', 3.0, -2.2, 2.0, -2.0),
    reception: anchor('clinic', -3.2, -2.4, -3.2, -1.3),
    chairs: anchor('clinic', -1.6, 1.8, -1.6, 0.7),
    poster: anchor('clinic', -4.5, 0.2, -3.5, 0.2),
};

/** Every clickable point in the world, with the location it belongs to. */
export const ANCHORS: Record<string, { scene: SceneId; anchor: Anchor; labelHeight: number }> = {
    jonah: { scene: 'studio', anchor: STUDIO.jonah, labelHeight: 2.0 },
    mara: { scene: 'studio', anchor: STUDIO.mara, labelHeight: 2.0 },
    theo: { scene: 'studio', anchor: STUDIO.theo, labelHeight: 2.0 },
    nadia: { scene: 'studio', anchor: STUDIO.nadia, labelHeight: 2.0 },
    tara: { scene: 'studio', anchor: STUDIO.tara, labelHeight: 2.0 },
    laptop: { scene: 'studio', anchor: STUDIO.laptop, labelHeight: 1.7 },
    coffee: { scene: 'studio', anchor: STUDIO.coffee, labelHeight: 1.9 },

    home_desk: { scene: 'home', anchor: HOME.desk, labelHeight: 1.7 },
    home_phone: { scene: 'home', anchor: HOME.phone, labelHeight: 1.5 },
    home_bed: { scene: 'home', anchor: HOME.bed, labelHeight: 1.3 },
    home_couch: { scene: 'home', anchor: HOME.couch, labelHeight: 1.4 },
    home_window: { scene: 'home', anchor: HOME.window, labelHeight: 2.4 },

    bar_priya: { scene: 'bar', anchor: BAR.priya, labelHeight: 2.0 },
    bar_counter: { scene: 'bar', anchor: BAR.counter, labelHeight: 2.0 },
    bar_jukebox: { scene: 'bar', anchor: BAR.jukebox, labelHeight: 1.9 },
    bar_pool: { scene: 'bar', anchor: BAR.pool, labelHeight: 1.4 },
    bar_window: { scene: 'bar', anchor: BAR.window, labelHeight: 2.4 },

    family_mum: { scene: 'family', anchor: FAMILY.mum, labelHeight: 2.0 },
    family_sister: { scene: 'family', anchor: FAMILY.sister, labelHeight: 2.0 },
    family_table: { scene: 'family', anchor: FAMILY.table, labelHeight: 1.5 },
    family_fireplace: { scene: 'family', anchor: FAMILY.fireplace, labelHeight: 2.1 },
    family_kitchen: { scene: 'family', anchor: FAMILY.kitchen, labelHeight: 1.9 },

    pub_mara: { scene: 'publisher', anchor: PUBLISHER.mara, labelHeight: 2.0 },
    pub_exec: { scene: 'publisher', anchor: PUBLISHER.exec, labelHeight: 2.0 },
    pub_table: { scene: 'publisher', anchor: PUBLISHER.table, labelHeight: 1.6 },
    pub_screen: { scene: 'publisher', anchor: PUBLISHER.screen, labelHeight: 2.6 },
    pub_reception: { scene: 'publisher', anchor: PUBLISHER.reception, labelHeight: 2.0 },

    roof_theo: { scene: 'rooftop', anchor: ROOFTOP.theo, labelHeight: 2.0 },
    roof_mara: { scene: 'rooftop', anchor: ROOFTOP.mara, labelHeight: 2.0 },
    roof_jonah: { scene: 'rooftop', anchor: ROOFTOP.jonah, labelHeight: 2.0 },
    roof_edge: { scene: 'rooftop', anchor: ROOFTOP.edge, labelHeight: 1.6 },
    roof_bench: { scene: 'rooftop', anchor: ROOFTOP.bench, labelHeight: 1.4 },
    roof_door: { scene: 'rooftop', anchor: ROOFTOP.door, labelHeight: 2.2 },

    clinic_doctor: { scene: 'clinic', anchor: CLINIC.doctor, labelHeight: 2.0 },
    clinic_reception: { scene: 'clinic', anchor: CLINIC.reception, labelHeight: 1.9 },
    clinic_chairs: { scene: 'clinic', anchor: CLINIC.chairs, labelHeight: 1.4 },
    clinic_poster: { scene: 'clinic', anchor: CLINIC.poster, labelHeight: 2.0 },

    ward_dad: { scene: 'hospital', anchor: HOSPITAL.dad, labelHeight: 1.5 },
    ward_mum: { scene: 'hospital', anchor: HOSPITAL.mum, labelHeight: 2.0 },
    ward_nurse: { scene: 'hospital', anchor: HOSPITAL.nurse, labelHeight: 2.0 },
    ward_window: { scene: 'hospital', anchor: HOSPITAL.window, labelHeight: 2.3 },
    ward_corridor: { scene: 'hospital', anchor: HOSPITAL.corridor, labelHeight: 2.0 },
};

/** Floor extents per location — used by the minimap and camera clamping. */
export interface RoomBounds { minX: number; maxX: number; minZ: number; maxZ: number; }

export const ROOM_BOUNDS: Record<SceneId, RoomBounds> = {
    studio: { minX: -6.4, maxX: 6.4, minZ: -4.9, maxZ: 4.9 },
    home: { minX: OFFSETS.home - 4.5, maxX: OFFSETS.home + 4.5, minZ: -4.0, maxZ: 4.0 },
    bar: { minX: OFFSETS.bar - 5.0, maxX: OFFSETS.bar + 5.0, minZ: -4.1, maxZ: 4.4 },
    family: { minX: OFFSETS.family - 5.2, maxX: OFFSETS.family + 5.2, minZ: -4.3, maxZ: 4.5 },
    publisher: { minX: OFFSETS.publisher - 5.6, maxX: OFFSETS.publisher + 5.6, minZ: -4.1, maxZ: 4.5 },
    rooftop: { minX: OFFSETS.rooftop - 5.0, maxX: OFFSETS.rooftop + 5.0, minZ: -4.4, maxZ: 4.2 },
    clinic: { minX: OFFSETS.clinic - 5.0, maxX: OFFSETS.clinic + 5.0, minZ: -3.7, maxZ: 4.0 },
    hospital: { minX: OFFSETS.hospital - 5.0, maxX: OFFSETS.hospital + 5.0, minZ: -3.9, maxZ: 4.0 },
};

/**
 * Where the player's body actually goes when an interaction seats them, so
 * "sit on the couch" really does put them on the couch facing the room.
 */
export interface Seat { x: number; z: number; yaw: number; }

export const SEATS: Record<string, Seat> = {
    laptop: { x: 0.4, z: -2.78, yaw: Math.PI },
    home_desk: { x: OFFSETS.home - 2.6, z: -2.68, yaw: Math.PI },
    home_couch: { x: OFFSETS.home - 2.4, z: 2.62, yaw: 0 },
    home_bed: { x: OFFSETS.home + 2.4, z: -0.05, yaw: 0 },
    bar_counter: { x: OFFSETS.bar + 2.2, z: -2.5, yaw: Math.PI },
    bar_priya: { x: OFFSETS.bar - 2.1, z: -0.6, yaw: -Math.PI / 2 },
    family_table: { x: OFFSETS.family + 1.4, z: -1.12, yaw: Math.PI },
    pub_table: { x: OFFSETS.publisher - 0.65, z: 0.0, yaw: Math.PI },
    roof_bench: { x: OFFSETS.rooftop - 3.4, z: 2.05, yaw: 0 },
    roof_edge: { x: OFFSETS.rooftop, z: -3.0, yaw: Math.PI },
    clinic_chairs: { x: OFFSETS.clinic - 1.6, z: 1.55, yaw: 0 },
    ward_dad: { x: OFFSETS.hospital + 1.5, z: -1.7, yaw: -Math.PI / 2 },
    ward_corridor: { x: OFFSETS.hospital - 3.4, z: 2.3, yaw: 0 },
};

/** Locations the player may travel to right now, in world order. */
export function openLocations(beat: string, unlocked: string[]): LocationInfo[] {
    return (Object.keys(LOCATIONS) as SceneId[])
        .map((id) => LOCATIONS[id])
        .filter((loc) => unlocked.includes(loc.id) && loc.openIn.includes(beat));
}
