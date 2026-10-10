/**
 * Dual-sphere state engine. Professional life (Mara, Jonah, Theo) and personal
 * life (family, outside friend) are tracked in one save object, persisted
 * through RUN app storage so a run continues across sessions and releases.
 */
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import type { SceneId } from '../world/anchors.ts';
import { NODES } from '../story/story.ts';
import { BEAT_FALLBACKS, migrateSave, SAVE_VERSION } from './migrate.ts';
import {
    activeBackend, isDurable, isPreviewEnvironment, readKey, removeKey, storageNote, writeKey,
} from './storage.ts';

export interface LegacySeeds {
    protected_theo: boolean;
    worked_weekend: boolean;
    blamed_theo: boolean;
    middle_path: boolean;
    took_family_call: boolean;
    closed_laptop: boolean;
    spoke_for_team: boolean;
    chose_family: boolean;
    phone_in_drawer: boolean;
    // Episode 2
    cut_scope: boolean;
    crunched_team: boolean;
    asked_for_time: boolean;
    pushed_theo: boolean;
    told_theo_himself: boolean;
    refused_mara: boolean;
    took_theo_to_clinic: boolean;
    booked_clinic: boolean;
    gave_slot_away: boolean;
    was_honest_doctor: boolean;
    held_the_line: boolean;
    // Episode 3
    took_the_lead: boolean;
    refused_lead: boolean;
    hired_nadia: boolean;
    promoted_theo: boolean;
    protected_jonah: boolean;
    made_theo_crunch: boolean;
    was_at_the_ward: boolean;
    missed_the_ward: boolean;
    told_mara_about_dad: boolean;
    hid_dad_from_work: boolean;
    signed_off_sick: boolean;
    burned_out_publicly: boolean;
    theo_resigned: boolean;
    jonah_resigned: boolean;
    // Explorer & Alternate Timeline Seeds (Episodes 1-7)
    found_jukebox_cassette: boolean;
    found_family_photo_note: boolean;
    found_rooftop_manifesto: boolean;
    discovered_vantage_leak: boolean;
    unlocked_indie_timeline: boolean;
    unlocked_coop_timeline: boolean;
    unlocked_reconciliation_timeline: boolean;
    // Episode 4 ("The Embedded Producer")
    stood_up_to_tara: boolean;
    allied_with_tara: boolean;
    sheltered_nadia_from_audit: boolean;
    jonah_mentored_nadia: boolean;
    // Episode 5 ("The Blackout")
    whistleblower_emailed: boolean;
    erased_crunch_records: boolean;
    pulled_all_nighter_solo: boolean;
    admitted_defeat_to_iris: boolean;
    // Episode 6 ("The Gold Master")
    pushed_launch_back: boolean;
    certified_flawed_build: boolean;
    gave_team_full_royalties: boolean;
    family_attended_launch: boolean;
    // Episode 7 ("The Horizon")
    founded_worker_coop: boolean;
    stayed_vantage_director: boolean;
    walked_away_clean: boolean;
    dad_recovered_proud: boolean;
}

export interface GameState {
    burnout: number;
    mara_trust: number;
    jonah_closeness: number;
    theo_trust: number;
    family_bond: number;
    friend_closeness: number;
    /** Episode 3 onward: your first direct report. */
    nadia_trust: number;
    legacy_seeds: LegacySeeds;
    /** Narrative node currently active, or null when free-roaming. */
    node: string | null;
    /** Story beat id — drives which interactions are live. */
    beat: string;
    scene: SceneId;
    /** Locations the story has opened up, in the order they were discovered. */
    unlocked: SceneId[];
    dayLabel: string;
    promoted: boolean;
    messages: PhoneMessage[];
    log: string[];
    visited: string[];
    /** Save-format version, used to migrate old saves forward. */
    version?: number;
}

export interface PhoneMessage {
    from: string;
    text: string;
    tone: 'family' | 'friend' | 'work';
    /**
     * Which reply set this message can be answered with. A message with no
     * thread — including anything a character sends BACK after your reply — is
     * simply read, never answered again.
     */
    thread?: string;
    /** Your reply, once you have sent one. This closes the message for good. */
    reply?: string;
    /** True when this message is a character answering your reply. */
    isReplyBack?: boolean;
}

/** A reply option offered for a message thread. */
export interface ReplyOption {
    text: string;
    hint: string;
    deltas?: Partial<Record<StatKey, number>>;
    /** What they send back. Arrives as a closed message — not re-answerable. */
    back?: string;
}

/**
 * Reply sets, keyed by THREAD, not by sender. A message only offers replies if
 * it carries a thread id, and answering it consumes that message — so a thread
 * can never loop back on itself.
 */
export const REPLIES: Record<string, ReplyOption[]> = {
    dad_first_week: [
        { text: 'They feed me. Mostly beige things.', hint: 'Play along', deltas: { family_bond: 5 }, back: 'Beige builds character. Proud of you son.' },
        { text: 'It is going well. Busy but good.', hint: 'The short version', deltas: { family_bond: 1 }, back: 'Good lad. Ring your mother.' },
        { text: 'Honestly? It is a lot. But I wanted this.', hint: 'Let him in', deltas: { family_bond: 8, burnout: -2 }, back: 'That is the most honest thing you have said in a year.' },
    ],
    priya_tape: [
        { text: 'I remember that garage. We had no budget and all the time in the world.', hint: 'Nostalgic', deltas: { friend_closeness: 8, burnout: -3 }, back: 'we made real things back then. you still can.' },
        { text: 'Track 4 holds up surprisingly well.', hint: 'Warm', deltas: { friend_closeness: 5 }, back: 'it is a certified garage banger.' },
    ],
    dad_boat: [
        { text: 'I read the note on the back, Dad. "Go home on time."', hint: 'Resonant', deltas: { family_bond: 10, burnout: -4 }, back: 'Hardest lesson I ever had to learn. Don’t wait till you are my age to learn it.' },
        { text: 'Thirty-two weekends is dedication. She was a good boat.', hint: 'Proud', deltas: { family_bond: 6 }, back: 'The best. Still misses the open water.' },
    ],
    jonah_charter: [
        { text: 'A studio without a publisher board. Imagine that.', hint: 'Hopeful', deltas: { jonah_closeness: 8, burnout: -2 }, back: 'maybe we build it for real one day.' },
        { text: 'Your secret is safe with me, Jonah.', hint: 'Loyal', deltas: { jonah_closeness: 6 }, back: 'appreciate it. keep your head down today.' },
    ],
    priya_drinks: [
        { text: 'I will be there. Actually there.', hint: 'Commit', deltas: { friend_closeness: 8, burnout: -3 }, back: 'BOOKED. i am telling the group chat.' },
        { text: 'Depends on the week. I will try.', hint: 'Hedge', deltas: { friend_closeness: -4 }, back: 'you always say try. i am putting you down as a maybe.' },
        { text: 'Only if you stop calling it a work event.', hint: 'Joke back', deltas: { friend_closeness: 5 }, back: 'it is a WORK EVENT for my mental health' },
    ],
    mum_pen: [
        { text: 'Pen. I meant it.', hint: 'Warm', deltas: { family_bond: 5, burnout: -2 }, back: 'I know you did. That is why I said it twice.' },
        { text: 'Do not tell the neighbours yet.', hint: 'Nervous', deltas: { family_bond: -2 }, back: 'Too late. Mrs Harding is thrilled.' },
    ],
    mum_thursday: [
        { text: 'Thursday. I promise I will know by then.', hint: 'Honest', deltas: { family_bond: 4 }, back: 'Thursday then. Eat something green.' },
        { text: 'Actually - put me down for Sunday.', hint: 'Commit late', deltas: { family_bond: 9 }, back: 'Oh good. I will do the thing with the potatoes.' },
    ],
    mum_call_back: [
        { text: 'I am sorry about earlier. Bad timing.', hint: 'Apologise', deltas: { family_bond: 7, burnout: -2 }, back: 'You are always forgiven. You know that.' },
        { text: 'Free now if you still want to talk.', hint: 'Make time', deltas: { family_bond: 9, burnout: -3 }, back: 'Putting the kettle on. Two minutes.' },
    ],
    mara_late: [
        { text: 'On it. I will have something by morning.', hint: 'Mara +, burnout +', deltas: { mara_trust: 7, burnout: 8 }, back: 'Do not stay up. (But thank you.)' },
        { text: 'Tomorrow. I am switching off tonight.', hint: 'Boundary', deltas: { mara_trust: -3, burnout: -5 }, back: 'Good. Genuinely. See you at nine.' },
        { text: 'Can we look at it together first thing?', hint: 'Share the load', deltas: { mara_trust: 4, jonah_closeness: 2 }, back: 'Nine sharp. Bring coffee.' },
    ],
    mara_review: [
        { text: 'He stopped looking at his phone. I noticed too.', hint: 'Take the win', deltas: { mara_trust: 6 }, back: 'Take it. You earned the eleven minutes.' },
        { text: 'It should not have been on me to say it.', hint: 'Push back', deltas: { mara_trust: -3, burnout: -2 }, back: 'No. It should not have. I am working on that.' },
    ],
    theo_thanks: [
        { text: 'You owe me nothing. Just breathe.', hint: 'Let him off', deltas: { theo_trust: 8, burnout: -2 }, back: 'okay. okay. thank you.' },
        { text: 'Buy me a coffee and we are square.', hint: 'Light', deltas: { theo_trust: 5 }, back: 'two coffees. every day this week.' },
        { text: 'Next time, tell someone before you push.', hint: 'A boundary of your own', deltas: { theo_trust: 3, mara_trust: 2 }, back: 'understood. genuinely. i wrote it on a note.' },
    ],
    jonah_noted: [
        { text: 'Somebody had to say it.', hint: 'Own it', deltas: { jonah_closeness: 7 }, back: 'not everybody would have. noted.' },
        { text: 'Do not make it a thing.', hint: 'Deflect', deltas: { jonah_closeness: 1 }, back: 'making it a thing. pint on friday.' },
    ],
    priya_normal_hour: [
        { text: 'Turns out I can go to sleep. Wild.', hint: 'Light', deltas: { friend_closeness: 6, burnout: -2 }, back: 'log it in the diary. historic day.' },
        { text: 'Do not get used to it.', hint: 'Honest', deltas: { friend_closeness: 1 }, back: 'i will take the one night.' },
    ],
    priya_real: [
        { text: 'Same time next week. I will book it.', hint: 'Keep it going', deltas: { friend_closeness: 8 }, back: 'in the diary. do not you dare cancel.' },
        { text: 'Thanks for asking properly.', hint: 'Warm', deltas: { friend_closeness: 5, burnout: -2 }, back: 'always. that is the whole job of me.' },
    ],
    iris_noticing: [
        { text: 'I noticed. I always notice.', hint: 'Take it seriously', deltas: { family_bond: 6 }, back: 'good. keep noticing.' },
        { text: 'Give me a break, Iris.', hint: 'Snap back', deltas: { family_bond: -4 }, back: 'fine. sorry. i just worry about you.' },
    ],
    jonah_weekends: [
        { text: 'I know. I pushed for it and I will own that.', hint: 'Own it', deltas: { jonah_closeness: 6 }, back: 'that is more than most would say. alright.' },
        { text: 'Go at five every one of them. I will cover.', hint: 'Take the weight', deltas: { jonah_closeness: 14, burnout: 10 }, back: 'i will not forget this. genuinely.' },
        { text: 'It was the only option that hit the date.', hint: 'Defend it', deltas: { jonah_closeness: -6 }, back: 'there is always another option. that is the job.' },
    ],
    mum_scan: [
        { text: 'Ring me any time. Three times if you need to.', hint: 'Open the door', deltas: { family_bond: 8, burnout: -2 }, back: 'I might hold you to that. x' },
        { text: 'I will come down at the weekend.', hint: 'Commit', deltas: { family_bond: 12, mara_trust: -3 }, back: 'Your dad will pretend not to be pleased.' },
    ],
    theo_clinic: [
        { text: 'Eleven hours. That is the best thing I have heard all month.', hint: 'Warm', deltas: { theo_trust: 8, burnout: -2 }, back: 'i am going again next week. on my own this time.' },
        { text: 'Do it again tonight. That is an instruction.', hint: 'Firm', deltas: { theo_trust: 6 }, back: 'yes boss. actually yes though.' },
    ],
    mara_clinic: [
        { text: 'She signed me off for two days.', hint: 'Tell her the truth', deltas: { mara_trust: 6, burnout: -6 }, back: 'Then take them. I will move the Friday review.' },
        { text: 'I will be in tomorrow regardless.', hint: 'Ignore the note', deltas: { mara_trust: -4, burnout: 8 }, back: 'I booked the appointment. Please use it.' },
    ],
    mara_signed_off: [
        { text: 'Thank you. I will actually rest.', hint: 'Accept it', deltas: { burnout: -14, mara_trust: 4 }, back: 'Good. I will send nothing. Not one thing.' },
        { text: 'I can still do the reviews from home.', hint: 'You cannot help yourself', deltas: { burnout: 8, mara_trust: -4 }, back: 'You will not. I have removed your access until Monday.' },
    ],
    theo_resigned: [
        { text: 'You are right. I am sorry, properly.', hint: 'Own it', deltas: { theo_trust: 10, burnout: 4 }, back: 'thank you for not arguing. that is something.' },
        { text: 'Can I talk you out of it?', hint: 'Try', deltas: { theo_trust: 5 }, back: 'no. but i will take the reference.' },
        { text: 'Then go somewhere better than this.', hint: 'Let him go', deltas: { theo_trust: 3, burnout: -2 }, back: 'that is the kindest thing anyone here has said.' },
    ],
    jonah_resigned: [
        { text: 'You were right about all of it.', hint: 'Concede', deltas: { jonah_closeness: 8 }, back: 'i did not want to be. pint sometime. genuinely.' },
        { text: 'I will do better for the next one.', hint: 'A promise', deltas: { jonah_closeness: 4, burnout: 3 }, back: 'then it was worth saying. good luck.' },
    ],
    nadia_first: [
        { text: 'Ask me anything, any time. I mean it.', hint: 'Open door', deltas: { nadia_trust: 8, burnout: 3 }, back: 'okay! i have written down about nine questions already, sorry' },
        { text: 'Read the build first, then bring me three questions.', hint: 'Structure', deltas: { nadia_trust: 5 }, back: 'three questions. on it. thank you.' },
    ],
    iris_drawer: [
        { text: 'It was easier than I expected.', hint: 'Honest', deltas: { family_bond: 6 }, back: 'she has told the whole street. brace yourself.' },
        { text: 'Do not let her make it a tradition.', hint: 'Joke', deltas: { family_bond: 3 }, back: 'too late. it is a TRADITION now.' },
    ],
};

export type StatKey =
    | 'burnout' | 'mara_trust' | 'jonah_closeness' | 'theo_trust'
    | 'family_bond' | 'friend_closeness'
    /** Episode 3: the junior who now reports to you. */
    | 'nadia_trust';

/**
 * One stable key for the whole series. Never change this — a new key would look
 * exactly like every player losing their progress. New episodes add fields to
 * the same save instead.
 *
 * Storage key rules worth remembering: a key must not contain '.' and must not
 * begin with '__' (reserved). An invalid key is rejected, which is exactly how
 * the save probe silently failed and switched saving off for everybody.
 */
const SAVE_KEY = 'shift_save';
/** Where an unreadable save is parked rather than deleted. */
const BACKUP_KEY = 'shift_save_backup';
/** The key used before the series had episode support. */
const LEGACY_KEYS = ['shift_ep1_save'];

export function freshState(): GameState {
    return {
        burnout: 20,
        mara_trust: 50,
        jonah_closeness: 50,
        theo_trust: 50,
        family_bond: 70,
        friend_closeness: 60,
        nadia_trust: 50,
        legacy_seeds: {
            protected_theo: false,
            worked_weekend: false,
            blamed_theo: false,
            middle_path: false,
            took_family_call: false,
            closed_laptop: false,
            spoke_for_team: false,
            chose_family: false,
            phone_in_drawer: false,
            cut_scope: false,
            crunched_team: false,
            asked_for_time: false,
            pushed_theo: false,
            told_theo_himself: false,
            refused_mara: false,
            took_theo_to_clinic: false,
            booked_clinic: false,
            gave_slot_away: false,
            was_honest_doctor: false,
            held_the_line: false,
            took_the_lead: false,
            refused_lead: false,
            hired_nadia: false,
            promoted_theo: false,
            protected_jonah: false,
            made_theo_crunch: false,
            was_at_the_ward: false,
            missed_the_ward: false,
            told_mara_about_dad: false,
            hid_dad_from_work: false,
            signed_off_sick: false,
            burned_out_publicly: false,
            theo_resigned: false,
            jonah_resigned: false,
            found_jukebox_cassette: false,
            found_family_photo_note: false,
            found_rooftop_manifesto: false,
            discovered_vantage_leak: false,
            unlocked_indie_timeline: false,
            unlocked_coop_timeline: false,
            unlocked_reconciliation_timeline: false,
            stood_up_to_tara: false,
            allied_with_tara: false,
            sheltered_nadia_from_audit: false,
            jonah_mentored_nadia: false,
            whistleblower_emailed: false,
            erased_crunch_records: false,
            pulled_all_nighter_solo: false,
            admitted_defeat_to_iris: false,
            pushed_launch_back: false,
            certified_flawed_build: false,
            gave_team_full_royalties: false,
            family_attended_launch: false,
            founded_worker_coop: false,
            stayed_vantage_director: false,
            walked_away_clean: false,
            dad_recovered_proud: false,
        },
        node: 'intro',
        beat: 'act1_arrival',
        scene: 'studio',
        unlocked: ['studio', 'home'],
        dayLabel: 'MONDAY - 9:12 AM',
        promoted: false,
        messages: [
            { from: 'Dad', text: 'Big first week! Your mum keeps asking if they feed you there.', tone: 'family', thread: 'dad_first_week' },
            { from: 'Priya', text: 'you actually took the job?? drinks friday. i am not accepting excuses', tone: 'friend', thread: 'priya_drinks' },
        ],
        log: [],
        visited: [],
        version: SAVE_VERSION,
    };
}

export const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function applyDeltas(state: GameState, deltas: Partial<Record<StatKey, number>>): GameState {
    const next = { ...state };
    for (const [key, delta] of Object.entries(deltas) as [StatKey, number][]) {
        next[key] = clamp100(next[key] + delta);
    }
    return next;
}

/**
 * Load a save, repairing it rather than discarding it.
 *
 * This is deliberately forgiving: a save written by ANY earlier version of the
 * game is migrated up to the current shape, missing fields are filled from
 * freshState(), and an unrecognised story beat is recovered to the nearest one
 * that still exists. The only save we walk away from is one that will not parse
 * at all — and even then we keep the raw text in a backup key so nothing a
 * player did is silently destroyed.
 */
/**
 * Outcome of a load attempt. "There is no save" and "we could not read the save"
 * are different things and must never be confused.
 */
export type LoadOutcome =
    | { status: 'loaded'; state: GameState }
    | { status: 'empty' }
    | { status: 'unavailable' };

/** Kept for compatibility with earlier call sites. */
export async function probeStorage(): Promise<boolean> {
    return isDurable();
}
export function storageReadable(): boolean {
    return true;
}

/**
 * Load a save, repairing it rather than discarding it. A save written by any
 * earlier version is migrated up; missing fields fill in from freshState().
 */
/* --------------------------- METER CONSEQUENCES --------------------------- */
/**
 * The point of a meter is that reaching its edge changes the story. These are
 * checked whenever state changes; each fires once and records itself in
 * legacy_seeds so it cannot repeat.
 */
export interface Consequence {
    seed: keyof LegacySeeds;
    /** True when this consequence should fire. */
    when(state: GameState): boolean;
    /** Applied when it fires. */
    apply(state: GameState): GameState;
}

export const CONSEQUENCES: Consequence[] = [
    {
        // Burnout at the ceiling: your body makes the decision for you.
        seed: 'signed_off_sick',
        when: (s) => s.burnout >= 92 && !s.legacy_seeds.signed_off_sick,
        apply: (s) => ({
            ...s,
            burnout: 62,
            mara_trust: clamp100(s.mara_trust - 5),
            legacy_seeds: { ...s.legacy_seeds, signed_off_sick: true },
            log: [...s.log, 'You were signed off sick. The work carried on without you.'],
            messages: [...s.messages, {
                from: 'Mara',
                text: 'You are signed off for the week. This is not a negotiation and it is not a black mark.',
                tone: 'work' as const,
                thread: 'mara_signed_off',
            }],
        }),
    },
    {
        // Theo, pushed too far, leaves.
        seed: 'theo_resigned',
        when: (s) => s.theo_trust <= 8 && !s.legacy_seeds.theo_resigned,
        apply: (s) => ({
            ...s,
            legacy_seeds: { ...s.legacy_seeds, theo_resigned: true },
            log: [...s.log, 'Theo handed in his notice.'],
            messages: [...s.messages, {
                from: 'Theo',
                text: 'i have given my notice. it is not all you. but it is partly you.',
                tone: 'work' as const,
                thread: 'theo_resigned',
            }],
        }),
    },
    {
        // Jonah has done four of these. He will not do a fifth like this.
        seed: 'jonah_resigned',
        when: (s) => s.jonah_closeness <= 8 && !s.legacy_seeds.jonah_resigned,
        apply: (s) => ({
            ...s,
            legacy_seeds: { ...s.legacy_seeds, jonah_resigned: true },
            log: [...s.log, 'Jonah resigned. He took the nursery pickup and never came back.'],
            messages: [...s.messages, {
                from: 'Jonah',
                text: 'four of these was enough. i hope the fifth one treats you better than it treated me.',
                tone: 'work' as const,
                thread: 'jonah_resigned',
            }],
        }),
    },
];

/** Apply any consequence whose conditions are now met. */
export function applyConsequences(state: GameState): GameState {
    let next = state;
    for (const consequence of CONSEQUENCES) {
        if (consequence.when(next)) next = consequence.apply(next);
    }
    return next;
}

export async function loadStateDetailed(): Promise<LoadOutcome> {
    const primary = await readKey(SAVE_KEY);
    let raw = primary.value;

    if (!primary.ok && raw == null) {
        return { status: 'unavailable' };
    }

    // Adopt a save written under an older key.
    if (raw == null) {
        for (const key of LEGACY_KEYS) {
            const legacy = await readKey(key);
            if (legacy.value != null) {
                raw = legacy.value;
                try {
                    RundotGameAPI.analytics.recordCustomEvent('save_adopted', { from_key: key });
                } catch { /* analytics unavailable */ }
                break;
            }
        }
    }

    if (raw == null) return { status: 'empty' };

    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
        // Corrupt. Keep a copy rather than deleting it, then start fresh.
        await writeKey(BACKUP_KEY, raw);
        try {
            RundotGameAPI.analytics.recordCustomEvent('save_corrupt_backed_up');
        } catch { /* analytics unavailable */ }
        return { status: 'empty' };
    }

    const { state: migrated, changed, notes } = migrateSave(parsed);
    const base = freshState();

    const merged: GameState = {
        ...base,
        ...migrated,
        legacy_seeds: { ...base.legacy_seeds, ...(migrated.legacy_seeds ?? {}) },
        unlocked: migrated.unlocked?.length ? migrated.unlocked : base.unlocked,
        messages: Array.isArray(migrated.messages) ? migrated.messages : base.messages,
        log: Array.isArray(migrated.log) ? migrated.log : base.log,
        visited: Array.isArray(migrated.visited) ? migrated.visited : base.visited,
        burnout: typeof migrated.burnout === 'number' ? clamp100(migrated.burnout) : base.burnout,
        mara_trust: typeof migrated.mara_trust === 'number' ? clamp100(migrated.mara_trust) : base.mara_trust,
        jonah_closeness: typeof migrated.jonah_closeness === 'number' ? clamp100(migrated.jonah_closeness) : base.jonah_closeness,
        theo_trust: typeof migrated.theo_trust === 'number' ? clamp100(migrated.theo_trust) : base.theo_trust,
        family_bond: typeof migrated.family_bond === 'number' ? clamp100(migrated.family_bond) : base.family_bond,
        friend_closeness: typeof migrated.friend_closeness === 'number' ? clamp100(migrated.friend_closeness) : base.friend_closeness,
        nadia_trust: typeof migrated.nadia_trust === 'number' ? clamp100(migrated.nadia_trust) : base.nadia_trust,
    };

    // An unknown beat is recovered rather than left unplayable.
    if (!BEAT_FALLBACKS[merged.beat]) {
        merged.beat = merged.visited.includes('__ep2_shown')
            ? 'ep2_epilogue'
            : merged.visited.includes('__ep1_shown')
                ? 'epilogue'
                : 'act1_arrival';
        merged.node = null;
    }
    if (merged.node && !(merged.node in NODES)) merged.node = null;

    if (changed || notes.length > 0) {
        try {
            RundotGameAPI.analytics.recordCustomEvent('save_migrated', {
                to_version: SAVE_VERSION,
                beat: merged.beat,
                notes: notes.join(',').slice(0, 90) || 'shape_only',
            });
        } catch { /* analytics unavailable */ }
        void saveState(merged);
    }

    return { status: 'loaded', state: merged };
}

/** Convenience wrapper: the loaded state, or null for empty/unavailable. */
export async function loadState(): Promise<GameState | null> {
    const outcome = await loadStateDetailed();
    return outcome.status === 'loaded' ? outcome.state : null;
}

/* -------------------------- SAVE DIAGNOSTICS ---------------------------- */
/**
 * Every save attempt reports its outcome, so a failing save can never look like
 * a working one again.
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface SaveReport {
    status: SaveStatus;
    error?: string;
    at?: number;
    bytes?: number;
    writes: number;
    /** Where progress is being kept, and whether it survives a refresh. */
    backend: string;
    durable: boolean;
    /** Explanation shown when saving is not durable (e.g. a sandboxed preview). */
    note?: string;
    /** True only in a creator preview / local dev run — never for real players. */
    preview: boolean;
}

let report: SaveReport = {
    status: 'idle', writes: 0, backend: 'memory', durable: false, preview: false,
};
const reportListeners = new Set<(r: SaveReport) => void>();

export function saveReport(): SaveReport { return report; }
export function onSaveReport(fn: (r: SaveReport) => void): () => void {
    reportListeners.add(fn);
    return () => reportListeners.delete(fn);
}
function setReport(next: Partial<SaveReport>) {
    report = { ...report, ...next };
    for (const fn of reportListeners) fn(report);
}

/** Called once storage has been probed, so the UI can describe the situation. */
export function publishStorageStatus() {
    setReport({
        backend: activeBackend().id,
        durable: isDurable(),
        preview: isPreviewEnvironment(),
        note: storageNote() || undefined,
    });
}

export function blockSaves(reason: string) {
    try {
        RundotGameAPI.analytics.recordCustomEvent('save_warning', { reason });
    } catch { /* analytics unavailable */ }
}
export function unblockSaves() { /* nothing to unblock */ }
export function savesBlocked(): boolean { return false; }

/**
 * Persist the run to whichever backend actually works, verifying the write by
 * reading it back. Retries a few times, then reports failure honestly instead of
 * pretending it saved.
 */
export async function saveState(state: GameState): Promise<boolean> {
    const payload = JSON.stringify({ ...state, version: SAVE_VERSION });
    setReport({ status: 'saving' });

    let lastError = 'unknown error';
    for (let attempt = 0; attempt < 3; attempt++) {
        const result = await writeKey(SAVE_KEY, payload);
        if (result.ok) {
            setReport({
                status: 'saved',
                error: undefined,
                at: Date.now(),
                bytes: payload.length,
                writes: report.writes + 1,
                backend: activeBackend().id,
                durable: isDurable(),
                preview: isPreviewEnvironment(),
                note: storageNote() || undefined,
            });
            return true;
        }
        lastError = result.error ?? 'write failed';
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }

    setReport({
        status: 'failed',
        error: lastError,
        backend: activeBackend().id,
        durable: isDurable(),
        preview: isPreviewEnvironment(),
        note: storageNote() || undefined,
    });
    try {
        RundotGameAPI.analytics.recordCustomEvent('save_failed', {
            reason: lastError,
            backend: activeBackend().id,
            beat: state.beat,
        });
    } catch { /* analytics unavailable */ }
    console.warn('[save] could not persist progress:', lastError);
    return false;
}

/**
 * Wipe the current run. Only ever called when the player themselves chooses to
 * start again — never as a consequence of an update.
 */
export async function clearState(): Promise<void> {
    try {
        await removeKey(SAVE_KEY);
        for (const key of LEGACY_KEYS) {
            await removeKey(key);
        }
    } catch {
        /* nothing to clear */
    }
}
