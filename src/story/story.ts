/**
 * Narrative engine data: dialogue nodes, choices, their effects on the two
 * spheres of life, and which world interactions are live in each story beat.
 */
import type { GameState, StatKey } from '../state/gameState.ts';
import type { SceneId } from '../world/anchors.ts';

export interface Choice {
    text: string;
    /** Short flavour shown under the choice, e.g. what it costs you. */
    hint?: string;
    /** Locations this choice opens up for good. */
    unlock?: string[];
    deltas?: Partial<Record<StatKey, number>>;
    seeds?: Partial<GameState['legacy_seeds']>;
    next?: string | null;
    beat?: string;
    scene?: SceneId;
    dayLabel?: string;
    promote?: boolean;
    message?: { from: string; text: string; tone: 'family' | 'friend' | 'work'; thread?: string };
    log?: string;
}

export interface Line {
    speaker: string;
    /** Character key for the portrait colour + camera focus, or 'narration'. */
    who: 'player' | 'mara' | 'jonah' | 'theo' | 'family' | 'friend' | 'sister' | 'exec' | 'narration' | 'nadia' | 'priya' | 'tara';
    text: string;
}

export interface StoryNode {
    lines: Line[];
    /** Locations opened when this node ends. */
    unlockOnEnd?: string[];
    /** Move to this location the moment the node opens, before any line plays. */
    sceneOnEnter?: SceneId;
    dayLabelOnEnter?: string;
    /** Seat the player here while the node plays (couch, bed, stool...). */
    seatAt?: string;
    /** Fade to black at the end of the node, then continue. */
    sleep?: boolean;
    choices?: Choice[];
    /** Applied the moment the node opens. */
    onEnter?: Omit<Choice, 'text' | 'hint'>;
    /** With no choices, this is where the node goes when the player taps on. */
    next?: string | null;
    beatOnEnd?: string;
    sceneOnEnd?: SceneId;
    dayLabelOnEnd?: string;
}

export interface Interaction {
    id: string;
    label: string;
    /** Story beats in which this interaction can be clicked. */
    beats: string[];
    node: string;
    /** Pose the player takes on arrival. */
    arrivePose?: 'idle' | 'sit' | 'type' | 'review';
    once?: boolean;
    /** True for the interaction that advances the story in its beat. */
    key?: boolean;
    /**
     * A node that must have been played before this becomes available. Stops a
     * later step (going home to bed) from being offered — or becoming the stated
     * objective — while an earlier one (finding Priya) is still outstanding.
     */
    needs?: string;
}

/** What the player should do right now, per story beat. Drives the objective banner. */
export const OBJECTIVES: Record<string, { title: string; hint: string }> = {
    // NOTE: hints must NOT say "travel to X" or "walk to Y". Where the player has
    // to go is worked out at runtime from their actual position (see objective()
    // in runtime.ts); a hard-coded direction goes stale the moment they move.
    act1_arrival: {
        title: 'Meet Jonah',
        hint: 'He is at the desks in the open-plan area.',
    },
    act1_mara: {
        title: 'See Mara',
        hint: 'She has been in the glass office since seven.',
    },
    act2_home: {
        title: 'Open the work laptop',
        hint: 'The publisher notes are on the desk by the window.',
    },
    act2_call: {
        title: 'Answer the family call',
        hint: 'Your phone is ringing on the kitchen counter.',
    },
    act2_choice: {
        title: 'Get some sleep',
        hint: 'Or wander a while first. Nothing is forcing you to bed.',
    },
    act3_collision: {
        title: 'Talk to Theo',
        hint: 'He is by the printer. Mara is coming.',
    },
    act3_verdict: {
        title: 'Mara wants a word',
        hint: 'She already knows what happened this morning.',
    },
    act4_thursday: {
        title: 'The publisher review',
        hint: 'Vantage Publishing, eleven o\'clock.',
    },
    act4_friday: {
        title: 'Friday at the Lamplighter',
        hint: 'Priya has a booth and she is not accepting excuses.',
    },
    act4_sunday: {
        title: 'Sunday at your family\'s house',
        hint: 'They kept a seat for you.',
    },
    ep2_return: {
        title: 'Back at Northlight',
        hint: 'Thirty-four days to the slice. See Mara first.',
    },
    ep2_crunch: {
        title: 'Week three of crunch',
        hint: 'Everyone needs something. You cannot give it all.',
    },
    ep2_break: {
        title: 'Something has to give',
        hint: 'Theo did not go home. He is up on the roof.',
    },
    ep2_clinic: {
        title: 'Twenty minutes for yourself',
        hint: 'Mara booked it in your name. Three o\'clock.',
    },
    ep2_slice: {
        title: 'The slice',
        hint: 'Halvard wants a date he can put in a deck.',
    },
    ep3_lead: {
        title: 'You have a report now',
        hint: 'Nadia starts today. Mara wants you to be the person Theo needed.',
    },
    ep3_people: {
        title: 'Three people, one of you',
        hint: 'Nadia is drowning, Jonah is done, Theo wants the job you were given.',
    },
    ep3_ward: {
        title: 'Ward 6',
        hint: 'Your dad went in on Tuesday. Nobody at work knows.',
    },
    ep3_reckoning: {
        title: 'The reckoning',
        hint: 'Halvard wants a name attached to the slip. Choose whose.',
    },
    ep3_epilogue: {
        title: 'End of Episode 3',
        hint: 'Everywhere is open. Sleep to begin Episode 4.',
    },
    // ---- Episode 4 ----
    ep4_monday: {
        title: 'The embedded producer',
        hint: 'Tara Patel has arrived from Vantage. She is at Jonah\'s desk.',
    },
    ep4_producer: {
        title: 'The audit review',
        hint: 'Tara wants your time sheets in the glass office.',
    },
    ep4_standoff: {
        title: 'Friday at the Lamplighter',
        hint: 'Priya is waiting. Her sister is in town.',
    },
    ep4_epilogue: {
        title: 'End of Episode 4',
        hint: 'Every room is open. Sleep to begin Episode 5.',
    },
    // ---- Episode 5 ----
    ep5_blackout: {
        title: 'Server emergency',
        hint: 'Two in the morning. The studio build is corrupted.',
    },
    ep5_leak: {
        title: 'The paper trail',
        hint: 'Investigate the logs on your home laptop.',
    },
    ep5_reckoning: {
        title: 'Halvard is downstairs',
        hint: 'Face the publisher with what remains.',
    },
    ep5_epilogue: {
        title: 'End of Episode 5',
        hint: 'Sit with the choices made. Sleep to begin Episode 6.',
    },
    // ---- Episode 6 ----
    ep6_gold: {
        title: 'Certification deadline',
        hint: 'The Gold Master build must be submitted by midnight.',
    },
    ep6_cert: {
        title: 'Sign the release',
        hint: 'The memory leak bug remains. Choose whether to certify.',
    },
    ep6_launch_night: {
        title: 'Launch night',
        hint: 'Reviews are going live at midnight.',
    },
    ep6_epilogue: {
        title: 'End of Episode 6',
        hint: 'The game is out in the world. Rest before Episode 7.',
    },
    // ---- Episode 7 ----
    ep7_aftermath: {
        title: 'Two months later',
        hint: 'The numbers are in. See Mara at Northlight.',
    },
    ep7_reckoning: {
        title: 'Halvard\'s final offer',
        hint: 'Vantage Publishing, eleven o\'clock.',
    },
    ep7_future: {
        title: 'Choose your path',
        hint: 'Every door is open. Decide who you will become.',
    },
    ep7_epilogue: {
        title: 'End of Shift',
        hint: 'The full story is written. Wander all the rooms of your life.',
    },
    ep2_epilogue: {
        title: 'End of Episode 2',
        hint: 'Everywhere is open. Go and sit somewhere.',
    },
    epilogue: {
        title: 'End of Episode 1',
        hint: 'Rest, see the people who waited, then begin Episode 2.',
    },
};

export const INTERACTIONS: Interaction[] = [
    { id: 'jonah', label: 'Talk to Jonah', beats: ['act1_arrival'], node: 'jonah_intro', once: true, key: true },
    { id: 'mara', label: "Speak to Mara", beats: ['act1_mara'], node: 'mara_brief', once: true, key: true },
    { id: 'coffee', label: 'Coffee machine', beats: ['act1_arrival', 'act1_mara'], node: 'coffee_beat' },
    { id: 'theo', label: 'Theo (break area)', beats: ['act1_arrival', 'act1_mara'], node: 'theo_hello', once: true },
    { id: 'laptop', label: 'Your desk', beats: ['act1_arrival', 'act1_mara'], node: 'desk_look' },
    { id: 'home_desk', label: 'Work laptop', beats: ['act2_home'], node: 'home_emails', arrivePose: 'type', once: true, key: true },
    { id: 'home_phone', label: 'Answer the call', beats: ['act2_call'], node: 'family_call', once: true, key: true },
    { id: 'home_window', label: 'Look out the window', beats: ['act2_home', 'act2_call', 'act2_choice'], node: 'home_window_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['act2_home', 'act2_call', 'act2_choice'], node: 'home_couch_beat' },
    { id: 'home_bed', label: 'Go to bed', beats: ['act2_choice'], node: 'home_sleep', key: true },
    { id: 'theo', label: 'Theo needs you', beats: ['act3_collision'], node: 'theo_crisis', once: true, key: true },
    { id: 'mara', label: 'Mara wants a word', beats: ['act3_verdict'], node: 'mara_verdict', once: true, key: true },
    { id: 'laptop', label: 'Check the build', beats: ['act3_collision'], node: 'build_check' },

    // ---- Act 4: the world opens up ----
    // Thursday: the publisher review.
    { id: 'pub_reception', label: 'Sign in at reception', beats: ['act4_thursday'], node: 'pub_arrive', once: true, key: true },
    { id: 'pub_screen', label: 'The build on the big screen', beats: ['act4_thursday'], node: 'pub_screen_beat' },
    { id: 'pub_mara', label: 'Stand with Mara', beats: ['act4_thursday'], node: 'pub_with_mara', once: true },
    { id: 'pub_exec', label: 'Face the publisher', beats: ['act4_thursday'], node: 'pub_review', once: true, key: true, needs: 'pub_arrive' },
    { id: 'pub_table', label: 'The review table', beats: ['act4_thursday'], node: 'pub_table_beat' },

    // Friday: the bar.
    { id: 'bar_priya', label: 'Find Priya', beats: ['act4_friday'], node: 'bar_priya_beat', once: true, key: true },
    { id: 'bar_counter', label: 'Order a drink', beats: ['act4_friday'], node: 'bar_counter_beat' },
    { id: 'bar_jukebox', label: 'Jukebox', beats: ['act4_friday'], node: 'bar_jukebox_beat' },
    { id: 'bar_pool', label: 'Pool table', beats: ['act4_friday'], node: 'bar_pool_beat' },
    { id: 'bar_window', label: 'Watch the street', beats: ['act4_friday'], node: 'bar_window_beat' },
    // Only offered once Priya has actually been met, so it can never become the
    // objective while she is still waiting in her booth.
    { id: 'home_bed', label: 'Head home to bed', beats: ['act4_friday'], node: 'friday_end', key: true, needs: 'bar_priya_beat' },

    // Sunday: the family house.
    { id: 'family_mum', label: 'Find your mum', beats: ['act4_sunday'], node: 'family_mum_beat', once: true, key: true },
    { id: 'family_sister', label: 'Talk to your sister', beats: ['act4_sunday'], node: 'family_sister_beat', once: true },
    { id: 'family_kitchen', label: 'Help in the kitchen', beats: ['act4_sunday'], node: 'family_kitchen_beat' },
    { id: 'family_fireplace', label: 'The photos on the mantel', beats: ['act4_sunday'], node: 'family_photos_beat' },
    { id: 'family_table', label: 'Sit down to dinner', beats: ['act4_sunday'], node: 'family_dinner', once: true, key: true, needs: 'family_mum_beat' },

    // Epilogue: wander anywhere.
    { id: 'coffee', label: 'Coffee machine', beats: ['epilogue'], node: 'coffee_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['epilogue'], node: 'home_couch_beat' },
    { id: 'bar_counter', label: 'Order a drink', beats: ['epilogue'], node: 'bar_counter_beat' },
    { id: 'family_fireplace', label: 'The photos on the mantel', beats: ['epilogue'], node: 'family_photos_beat' },
    { id: 'family_kitchen', label: 'Help in the kitchen', beats: ['epilogue'], node: 'family_kitchen_beat' },
    { id: 'bar_pool', label: 'Pool table', beats: ['epilogue'], node: 'bar_pool_beat' },
    { id: 'home_bed', label: 'Sleep, and start Episode 2', beats: ['epilogue'], node: 'ep2_open', key: true },
    // ================= EPISODE 2: "THE SLICE" =================
    // Return: back at the studio, six weeks out.
    { id: 'mara', label: 'Report to Mara', beats: ['ep2_return'], node: 'ep2_mara_plan', once: true, key: true },
    { id: 'jonah', label: 'Check on Jonah', beats: ['ep2_return', 'ep2_crunch'], node: 'ep2_jonah_state', once: true },
    { id: 'theo', label: 'Check on Theo', beats: ['ep2_return', 'ep2_crunch'], node: 'ep2_theo_state', once: true },
    { id: 'laptop', label: 'Your desk', beats: ['ep2_return', 'ep2_crunch', 'ep2_slice'], node: 'ep2_desk' },
    { id: 'coffee', label: 'Coffee machine', beats: ['ep2_return', 'ep2_crunch', 'ep2_break', 'ep2_slice'], node: 'coffee_beat' },
    { id: 'roof_edge', label: 'Look at the city', beats: ['ep2_return', 'ep2_crunch', 'ep2_break', 'ep2_slice', 'ep2_epilogue'], node: 'ep2_roof_edge' },
    { id: 'roof_bench', label: 'Sit on the bench', beats: ['ep2_return', 'ep2_crunch', 'ep2_break', 'ep2_slice', 'ep2_epilogue'], node: 'ep2_roof_bench' },

    // Crunch: three demands, and you cannot satisfy all of them.
    { id: 'mara', label: 'Mara needs a decision', beats: ['ep2_crunch'], node: 'ep2_crunch_mara', once: true, key: true },
    { id: 'roof_jonah', label: 'Jonah on the roof', beats: ['ep2_crunch'], node: 'ep2_roof_jonah', once: true },
    { id: 'home_desk', label: 'Work through the night', beats: ['ep2_crunch'], node: 'ep2_night_work', once: true },
    { id: 'home_phone', label: 'Your mum has rung twice', beats: ['ep2_crunch'], node: 'ep2_mum_calls', once: true },
    { id: 'bar_priya', label: 'Priya kept a seat', beats: ['ep2_crunch'], node: 'ep2_priya_seat', once: true },
    // Sleeping ends the crunch evening, so it only appears once Mara's decision
    // has actually been dealt with.
    { id: 'home_bed', label: 'Sleep', beats: ['ep2_crunch'], node: 'ep2_crunch_sleep', key: true, needs: 'ep2_crunch_after' },

    // Break: Theo has not gone home.
    { id: 'roof_theo', label: 'Theo, on the roof', beats: ['ep2_break'], node: 'ep2_theo_break', once: true, key: true },
    { id: 'roof_mara', label: 'Mara came up too', beats: ['ep2_break'], node: 'ep2_roof_mara', once: true },
    { id: 'roof_door', label: 'Go back inside', beats: ['ep2_break'], node: 'ep2_back_inside', key: true, needs: 'ep2_break_after' },

    // The clinic.
    { id: 'clinic_reception', label: 'Check in', beats: ['ep2_clinic'], node: 'ep2_clinic_checkin', once: true, key: true },
    { id: 'clinic_chairs', label: 'Wait your turn', beats: ['ep2_clinic'], node: 'ep2_clinic_wait' },
    { id: 'clinic_poster', label: 'Read the posters', beats: ['ep2_clinic'], node: 'ep2_clinic_poster' },
    { id: 'clinic_doctor', label: 'See the doctor', beats: ['ep2_clinic'], node: 'ep2_doctor', once: true, key: true, needs: 'ep2_clinic_checkin' },

    // The slice.
    { id: 'pub_reception', label: 'Sign in', beats: ['ep2_slice'], node: 'ep2_slice_arrive', once: true, key: true },
    { id: 'pub_screen', label: 'The slice on the wall', beats: ['ep2_slice'], node: 'ep2_slice_screen' },
    { id: 'pub_exec', label: 'Halvard is waiting', beats: ['ep2_slice'], node: 'ep2_slice_review', once: true, key: true, needs: 'ep2_slice_arrive' },

    // Epilogue 2: wander everything.
    { id: 'coffee', label: 'Coffee machine', beats: ['ep2_epilogue'], node: 'coffee_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['ep2_epilogue'], node: 'home_couch_beat' },
    { id: 'bar_counter', label: 'Order a drink', beats: ['ep2_epilogue'], node: 'bar_counter_beat' },
    { id: 'family_fireplace', label: 'The photos on the mantel', beats: ['ep2_epilogue'], node: 'family_photos_beat' },
    { id: 'family_kitchen', label: 'Help in the kitchen', beats: ['ep2_epilogue'], node: 'family_kitchen_beat' },
    { id: 'home_bed', label: 'Sleep, and start Episode 3', beats: ['ep2_epilogue'], node: 'ep3_open', key: true },
    // ================= EPISODE 3: "THE PERSON IN CHARGE" =================
    // Act 1: you are management now.
    { id: 'mara', label: 'Mara has news', beats: ['ep3_lead'], node: 'ep3_mara_offer', once: true, key: true },
    { id: 'laptop', label: 'Meet Nadia at your desk', beats: ['ep3_lead'], node: 'ep3_nadia_intro', once: true, key: true, needs: 'ep3_mara_offer' },
    { id: 'coffee', label: 'Coffee machine', beats: ['ep3_lead', 'ep3_people', 'ep3_reckoning'], node: 'coffee_beat' },
    { id: 'roof_edge', label: 'Look at the city', beats: ['ep3_lead', 'ep3_people', 'ep3_ward', 'ep3_reckoning', 'ep3_epilogue'], node: 'ep2_roof_edge' },
    { id: 'roof_bench', label: 'Sit on the bench', beats: ['ep3_lead', 'ep3_people', 'ep3_ward', 'ep3_reckoning', 'ep3_epilogue'], node: 'ep2_roof_bench' },

    // Act 2: three people want different things from you.
    { id: 'laptop', label: 'Nadia is stuck', beats: ['ep3_people'], node: 'ep3_nadia_stuck', once: true, key: true },
    { id: 'roof_jonah', label: 'Jonah, on the roof', beats: ['ep3_people'], node: 'ep3_jonah_out', once: true },
    { id: 'theo', label: 'Theo wants a word', beats: ['ep3_people'], node: 'ep3_theo_ambition', once: true },
    { id: 'mara', label: 'Mara wants your headcount', beats: ['ep3_people'], node: 'ep3_headcount', once: true, key: true, needs: 'ep3_nadia_stuck' },
    { id: 'home_phone', label: 'Your sister is ringing', beats: ['ep3_people'], node: 'ep3_iris_call', once: true, key: true, needs: 'ep3_headcount' },

    // Act 3: the ward.
    { id: 'ward_dad', label: 'Sit with your dad', beats: ['ep3_ward'], node: 'ep3_dad', once: true, key: true },
    { id: 'ward_mum', label: 'Your mum has not left', beats: ['ep3_ward'], node: 'ep3_mum_ward', once: true },
    { id: 'ward_nurse', label: 'Ask the nurse', beats: ['ep3_ward'], node: 'ep3_nurse' },
    { id: 'ward_window', label: 'The window', beats: ['ep3_ward', 'ep3_reckoning', 'ep3_epilogue'], node: 'ep3_ward_window' },
    { id: 'ward_corridor', label: 'The corridor', beats: ['ep3_ward'], node: 'ep3_corridor', once: true, key: true, needs: 'ep3_dad' },

    // Act 4: the reckoning.
    { id: 'pub_exec', label: 'Halvard wants a name', beats: ['ep3_reckoning'], node: 'ep3_halvard', once: true, key: true },
    { id: 'pub_mara', label: 'Mara, before you go in', beats: ['ep3_reckoning'], node: 'ep3_mara_before', once: true },
    { id: 'pub_screen', label: 'The slip on the wall', beats: ['ep3_reckoning'], node: 'ep3_slip' },
    { id: 'bar_priya', label: 'Priya, after', beats: ['ep3_reckoning'], node: 'ep3_priya_after', once: true, needs: 'ep3_halvard' },
    { id: 'home_bed', label: 'Sleep', beats: ['ep3_reckoning'], node: 'ep3_close', key: true, needs: 'ep3_halvard' },

    // Epilogue 3.
    { id: 'coffee', label: 'Coffee machine', beats: ['ep3_epilogue'], node: 'coffee_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['ep3_epilogue'], node: 'home_couch_beat' },
    { id: 'bar_counter', label: 'Order a drink', beats: ['ep3_epilogue'], node: 'bar_counter_beat' },
    { id: 'family_kitchen', label: 'Help in the kitchen', beats: ['ep3_epilogue'], node: 'family_kitchen_beat' },
    { id: 'ward_dad', label: 'Sit with your dad', beats: ['ep3_epilogue'], node: 'ep3_ward_visit' },
    { id: 'home_bed', label: 'Sleep, and start Episode 4', beats: ['ep3_epilogue'], node: 'ep4_open', key: true },

    // ================= EPISODE 4: "THE EMBEDDED PRODUCER" =================
    { id: 'tara', label: 'Meet Tara Patel', beats: ['ep4_monday'], node: 'ep4_tara_intro', once: true, key: true },
    { id: 'nadia', label: 'Check on Nadia', beats: ['ep4_monday', 'ep4_producer'], node: 'ep4_nadia_state', once: true },
    { id: 'jonah', label: 'Jonah looks furious', beats: ['ep4_monday'], node: 'ep4_jonah_state', once: true },
    { id: 'laptop', label: 'Your desk', beats: ['ep4_monday', 'ep4_producer'], node: 'ep4_desk' },
    { id: 'coffee', label: 'Coffee machine', beats: ['ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue'], node: 'coffee_beat' },
    { id: 'roof_edge', label: 'Look at the city', beats: ['ep4_monday', 'ep4_producer', 'ep4_standoff', 'ep4_epilogue'], node: 'ep2_roof_edge' },

    { id: 'tara', label: 'Tara\'s audit review', beats: ['ep4_producer'], node: 'ep4_audit_review', once: true, key: true },
    { id: 'mara', label: 'Mara behind the glass', beats: ['ep4_producer'], node: 'ep4_mara_pressure', once: true },
    { id: 'theo', label: 'Theo\'s art schedule', beats: ['ep4_producer'], node: 'ep4_theo_audit', once: true },
    { id: 'bar_priya', label: 'Priya called about her sister', beats: ['ep4_producer'], node: 'ep4_priya_warning', once: true, key: true, needs: 'ep4_audit_review' },

    { id: 'bar_priya', label: 'Dinner with Priya and Tara', beats: ['ep4_standoff'], node: 'ep4_sisters_meeting', once: true, key: true },
    { id: 'bar_counter', label: 'Order a drink', beats: ['ep4_standoff'], node: 'bar_counter_beat' },
    { id: 'bar_jukebox', label: 'Jukebox', beats: ['ep4_standoff'], node: 'bar_jukebox_beat' },
    { id: 'home_bed', label: 'Sleep', beats: ['ep4_standoff'], node: 'ep4_close', key: true, needs: 'ep4_sisters_meeting' },

    { id: 'coffee', label: 'Coffee machine', beats: ['ep4_epilogue'], node: 'coffee_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['ep4_epilogue'], node: 'home_couch_beat' },
    { id: 'bar_counter', label: 'Order a drink', beats: ['ep4_epilogue'], node: 'bar_counter_beat' },
    { id: 'home_bed', label: 'Sleep, and start Episode 5', beats: ['ep4_epilogue'], node: 'ep5_open', key: true },

    // ================= EPISODE 5: "THE BLACKOUT" =================
    { id: 'laptop', label: 'The corrupted build', beats: ['ep5_blackout'], node: 'ep5_server_crisis', once: true, key: true },
    { id: 'nadia', label: 'Nadia is shaking', beats: ['ep5_blackout'], node: 'ep5_nadia_tears', once: true },
    { id: 'theo', label: 'Theo at the render farm', beats: ['ep5_blackout'], node: 'ep5_theo_rescue', once: true },
    { id: 'mara', label: 'Mara\'s emergency meeting', beats: ['ep5_blackout'], node: 'ep5_mara_emergency', once: true, key: true, needs: 'ep5_server_crisis' },

    { id: 'home_desk', label: 'Search the old milestone logs', beats: ['ep5_leak'], node: 'ep5_home_investigate', once: true, key: true },
    { id: 'home_phone', label: 'Iris calling from home', beats: ['ep5_leak'], node: 'ep5_iris_dad_update', once: true, key: true, needs: 'ep5_home_investigate' },
    { id: 'roof_edge', label: 'Look out at the storm', beats: ['ep5_leak', 'ep5_reckoning'], node: 'ep2_roof_edge' },

    { id: 'pub_exec', label: 'Halvard demands answers', beats: ['ep5_reckoning'], node: 'ep5_halvard_reckoning', once: true, key: true },
    { id: 'pub_mara', label: 'Mara waiting outside', beats: ['ep5_reckoning'], node: 'ep5_mara_defense', once: true },
    { id: 'tara', label: 'Tara\'s private assessment', beats: ['ep5_reckoning'], node: 'ep5_tara_confession', once: true },
    { id: 'home_bed', label: 'Sleep', beats: ['ep5_reckoning'], node: 'ep5_close', key: true, needs: 'ep5_halvard_reckoning' },

    { id: 'coffee', label: 'Coffee machine', beats: ['ep5_epilogue'], node: 'coffee_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['ep5_epilogue'], node: 'home_couch_beat' },
    { id: 'family_fireplace', label: 'Photos on the mantel', beats: ['ep5_epilogue'], node: 'family_photos_beat' },
    { id: 'home_bed', label: 'Sleep, and start Episode 6', beats: ['ep5_epilogue'], node: 'ep6_open', key: true },

    // ================= EPISODE 6: "THE GOLD MASTER" =================
    { id: 'laptop', label: 'Inspect the release candidate', beats: ['ep6_gold'], node: 'ep6_rc_check', once: true, key: true },
    { id: 'nadia', label: 'Nadia\'s final polish', beats: ['ep6_gold'], node: 'ep6_nadia_polish', once: true },
    { id: 'theo', label: 'Theo found the fatal leak', beats: ['ep6_gold'], node: 'ep6_theo_fatal_bug', once: true, key: true, needs: 'ep6_rc_check' },
    { id: 'coffee', label: 'Coffee machine', beats: ['ep6_gold', 'ep6_cert', 'ep6_launch_night'], node: 'coffee_beat' },

    { id: 'mara', label: 'Sign the gold master cert', beats: ['ep6_cert'], node: 'ep6_sign_decision', once: true, key: true },
    { id: 'tara', label: 'Tara presents the waiver', beats: ['ep6_cert'], node: 'ep6_tara_waiver', once: true },
    { id: 'home_phone', label: 'Dad\'s pre-launch call', beats: ['ep6_cert'], node: 'ep6_dad_blessing', once: true, key: true, needs: 'ep6_sign_decision' },

    { id: 'bar_priya', label: 'Launch party at Lamplighter', beats: ['ep6_launch_night'], node: 'ep6_launch_celebration', once: true, key: true },
    { id: 'bar_counter', label: 'Toast the release', beats: ['ep6_launch_night'], node: 'bar_counter_beat' },
    { id: 'roof_edge', label: 'Midnight review scores drop', beats: ['ep6_launch_night'], node: 'ep6_reviews_arrive', once: true, key: true, needs: 'ep6_launch_celebration' },
    { id: 'home_bed', label: 'Sleep', beats: ['ep6_launch_night'], node: 'ep6_close', key: true, needs: 'ep6_reviews_arrive' },

    { id: 'coffee', label: 'Coffee machine', beats: ['ep6_epilogue'], node: 'coffee_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['ep6_epilogue'], node: 'home_couch_beat' },
    { id: 'home_bed', label: 'Sleep, and begin the Series Finale (Episode 7)', beats: ['ep6_epilogue'], node: 'ep7_open', key: true },

    // ================= EPISODE 7: "THE HORIZON" =================
    { id: 'mara', label: 'Two months later: The post-mortem', beats: ['ep7_aftermath'], node: 'ep7_mara_talk', once: true, key: true },
    { id: 'nadia', label: 'Nadia\'s industry award nomination', beats: ['ep7_aftermath'], node: 'ep7_nadia_awards', once: true },
    { id: 'theo', label: 'Theo packing his sketches', beats: ['ep7_aftermath'], node: 'ep7_theo_future', once: true },
    { id: 'jonah', label: 'Jonah stopped by with coffee', beats: ['ep7_aftermath'], node: 'ep7_jonah_visit', once: true },

    { id: 'pub_exec', label: 'Halvard\'s final contract offer', beats: ['ep7_reckoning'], node: 'ep7_halvard_offer', once: true, key: true },
    { id: 'pub_mara', label: 'Mara waiting in Vantage lobby', beats: ['ep7_reckoning'], node: 'ep7_mara_lobby_verdict', once: true },
    { id: 'tara', label: 'Tara\'s parting advice', beats: ['ep7_reckoning'], node: 'ep7_tara_final_advice', once: true },

    { id: 'family_table', label: 'Sunday dinner: What comes next', beats: ['ep7_future'], node: 'ep7_family_future', once: true, key: true },
    { id: 'bar_priya', label: 'Last call with Priya', beats: ['ep7_future'], node: 'ep7_priya_toast', once: true },
    { id: 'roof_edge', label: 'Stand on the roof and choose your life', beats: ['ep7_future'], node: 'ep7_crossroads_choice', once: true, key: true, needs: 'ep7_family_future' },

    // Epilogue 7: The Grand Finale Free Roam
    { id: 'coffee', label: 'Coffee machine', beats: ['ep7_epilogue'], node: 'coffee_beat' },
    { id: 'home_couch', label: 'Sit on the couch', beats: ['ep7_epilogue'], node: 'home_couch_beat' },
    { id: 'family_fireplace', label: 'The photos on the mantel', beats: ['ep7_epilogue'], node: 'family_photos_beat' },
    { id: 'bar_counter', label: 'Order a celebratory drink', beats: ['ep7_epilogue'], node: 'bar_counter_beat' },
    { id: 'roof_bench', label: 'Sit on the roof bench', beats: ['ep7_epilogue'], node: 'ep2_roof_bench' },
    { id: 'ward_dad', label: 'Visit Dad at the ward/home', beats: ['ep7_epilogue'], node: 'ep7_dad_farewell' },
];

export const NODES: Record<string, StoryNode> = {
    intro: {
        lines: [
            { who: 'narration', speaker: 'SHIFT - EPISODE 1', text: 'Northlight Interactive. Third floor. The lift smells of new carpet and old coffee.' },
            { who: 'player', speaker: 'You', text: 'Nine-twelve. Early enough to look keen, late enough that nobody watched me arrive.' },
            { who: 'narration', speaker: 'Northlight Studio', text: 'Tap a glowing label to walk over. Everything you do here costs something somewhere else.' },
        ],
        next: null,
        beatOnEnd: 'act1_arrival',
    },

    jonah_intro: {
        lines: [
            { who: 'jonah', speaker: 'Jonah', text: 'You must be the new one. Sit, stand, hover - honestly whatever helps.' },
            { who: 'jonah', speaker: 'Jonah', text: "I'm Jonah. Senior designer, which mostly means I know which parts of this build are held together with tape." },
        ],
        choices: [
            {
                text: '"Show me the tape. I would rather know now."',
                hint: 'Curious, direct',
                deltas: { jonah_closeness: 8 },
                log: 'Jonah showed you the ugly parts of the build on day one.',
                next: 'jonah_tape',
            },
            {
                text: '"I will stay out of your way until I understand the shape of it."',
                hint: 'Careful, deferential',
                deltas: { jonah_closeness: 3, mara_trust: 2 },
                next: 'jonah_tape',
            },
            {
                text: '"Mara said the project needs fresh eyes. That is why I am here."',
                hint: 'Confident, a little pointed',
                deltas: { jonah_closeness: -5, mara_trust: 4 },
                log: 'You led with Mara\'s name. Jonah noticed.',
                next: 'jonah_tape',
            },
        ],
    },
    jonah_tape: {
        lines: [
            { who: 'jonah', speaker: 'Jonah', text: 'Fair enough. Word of advice, free of charge: Mara will ask what you think. She means it. Just... pick your moment.' },
            { who: 'jonah', speaker: 'Jonah', text: "She's in the glass office. Been in there since seven." },
        ],
        next: null,
        beatOnEnd: 'act1_mara',
    },

    theo_hello: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'Oh - hi. Sorry. I am waiting for the printer to forgive me.' },
            { who: 'theo', speaker: 'Theo', text: 'I am Theo. Junior artist. I have been here five months and I still knock before entering the kitchen.' },
        ],
        choices: [
            {
                text: '"Five months in, you are basically the veteran now."',
                hint: 'Warm',
                deltas: { theo_trust: 8 },
                next: null,
            },
            {
                text: '"Who should I be careful around?"',
                hint: 'Reading the room',
                deltas: { theo_trust: 4, mara_trust: -2 },
                next: null,
            },
        ],
    },
    coffee_beat: {
        lines: [
            { who: 'narration', speaker: 'Break area', text: 'The machine gurgles. Someone has taped a note to it: BE PATIENT, LIKE IT IS PEOPLE.' },
            { who: 'player', speaker: 'You', text: 'Two minutes of nothing. It helps more than it should.' },
        ],
        onEnter: { deltas: { burnout: -3 } },
        next: null,
    },
    desk_look: {
        seatAt: 'laptop',
        lines: [
            { who: 'narration', speaker: 'Your desk', text: 'A monitor, a chair with someone else\'s posture worn into it, and a sticky note: WELCOME! - M.' },
            { who: 'player', speaker: 'You', text: 'You sit. It is your chair now, apparently.' },
        ],
        next: null,
    },

    mara_brief: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'You found it. Good. Close the door - the glass is decorative, the door is not.' },
            { who: 'mara', speaker: 'Mara', text: 'I hired you because this project is nine weeks from ship and it does not feel like anything yet. Publisher review is Thursday.' },
            { who: 'mara', speaker: 'Mara', text: 'So. First honest answer of your career here: what do you think of it?' },
        ],
        choices: [
            {
                text: '"It looks beautiful and plays like homework."',
                hint: 'Honest. Risky.',
                deltas: { mara_trust: 12, burnout: 4 },
                log: 'You told Mara the truth about the project in your first hour.',
                next: 'mara_truth',
            },
            {
                text: '"I need a week inside it before I say anything useful."',
                hint: 'Measured',
                deltas: { mara_trust: 4 },
                next: 'mara_truth',
            },
            {
                text: '"I think the team is tired, and that is showing up in the work."',
                hint: 'About people, not pixels',
                deltas: { mara_trust: 7, jonah_closeness: 6, burnout: 2 },
                log: 'You named the team\'s exhaustion out loud.',
                next: 'mara_truth',
            },
        ],
    },
    mara_truth: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Right.' },
            { who: 'mara', speaker: 'Mara', text: 'I am sending you the build and the publisher notes tonight. I am not asking you to work late. I want to be very clear that I am not asking.' },
            { who: 'player', speaker: 'You', text: 'She said it twice. People only say it twice when they are hoping.' },
        ],
        next: 'day_to_home',
    },
    day_to_home: {
        lines: [
            { who: 'narration', speaker: 'MONDAY - 8:40 PM', text: 'The bus. Then the stairs. Then your own door, which sticks in the cold.' },
            { who: 'narration', speaker: 'Home', text: 'The laptop is already open on the desk. The publisher notes arrived nineteen minutes ago.' },
        ],
        next: null,
        beatOnEnd: 'act2_home',
        sceneOnEnd: 'home',
        dayLabelOnEnd: 'MONDAY - 8:40 PM',
    },

    home_window_beat: {
        lines: [
            { who: 'narration', speaker: 'Window', text: 'The city keeps working. Somewhere out there another studio is nine weeks from ship too.' },
        ],
        next: null,
    },
    home_couch_beat: {
        lines: [
            { who: 'player', speaker: 'You', text: 'Five minutes. Just sitting. The ceiling has a crack shaped like a coastline.' },
            { who: 'narration', speaker: 'The couch', text: 'The cushions still hold the shape of whoever lived here before you.' },
        ],
        seatAt: 'home_couch',
        onEnter: { deltas: { burnout: -4 } },
        next: null,
    },

    home_emails: {
        seatAt: 'home_desk',
        lines: [
            { who: 'narration', speaker: 'Work laptop', text: 'PUBLISHER NOTES - NORTHLIGHT / "ATLAS". Forty-one comments. The word "unclear" appears nine times.' },
            { who: 'mara', speaker: 'Mara (email)', text: 'No pressure tonight. Genuinely. But if anything jumps out, I am up.' },
            { who: 'narration', speaker: 'Phone', text: 'Your phone lights up on the counter. HOME calling.' },
        ],
        next: null,
        beatOnEnd: 'act2_call',
    },

    family_call: {
        lines: [
            { who: 'family', speaker: 'Mum', text: 'There he is. We were starting a rumour that the job had eaten you.' },
            { who: 'family', speaker: 'Mum', text: 'Your sister is here. We are doing the thing on Sunday - you said you would come, but you also said that in March.' },
        ],
        choices: [
            {
                text: '"I will be there. Put me down in pen."',
                hint: 'Family +',
                deltas: { family_bond: 10, burnout: -2 },
                seeds: { took_family_call: true },
                log: 'You promised Sunday in pen.',
                message: { from: 'Mum', text: 'In PEN. I am telling everyone. x', tone: 'family', thread: 'mum_pen' },
                next: 'call_end',
            },
            {
                text: '"Sunday is tight. Can I tell you Thursday?"',
                hint: 'Honest, non-committal',
                deltas: { family_bond: -4 },
                seeds: { took_family_call: true },
                message: { from: 'Mum', text: 'Thursday then. Eat something green.', tone: 'family', thread: 'mum_thursday' },
                next: 'call_end',
            },
            {
                text: '"Can I call you back? I am in the middle of something."',
                hint: 'The words you will remember',
                deltas: { family_bond: -9, burnout: 3 },
                log: 'You cut the call short on your first Monday.',
                message: { from: 'Mum', text: 'Of course love. Whenever suits.', tone: 'family', thread: 'mum_call_back' },
                next: 'call_end',
            },
        ],
    },
    call_end: {
        lines: [
            { who: 'narration', speaker: 'Home', text: 'The call ends. The laptop is still glowing. Forty-one comments have not moved.' },
            { who: 'player', speaker: 'You', text: 'I could get through the notes tonight. Walk in tomorrow with answers instead of apologies.' },
        ],
        choices: [
            {
                text: 'Stay up. Work the notes until they make sense.',
                hint: 'Mara trust ++ / Burnout ++ / Family -',
                deltas: { mara_trust: 14, burnout: 18, family_bond: -8, friend_closeness: -5 },
                seeds: { worked_weekend: true },
                log: 'You worked the publisher notes until 3 AM on your first night.',
                message: { from: 'Mara', text: 'It is 2:51am. Go to sleep. (Thank you.)', tone: 'work', thread: 'mara_late' },
                next: 'late_night',
            },
            {
                text: 'Close the laptop. It can wait until morning.',
                hint: 'Family + / Burnout - / Mara cools',
                deltas: { mara_trust: -6, burnout: -6, family_bond: 8, friend_closeness: 3 },
                seeds: { closed_laptop: true },
                log: 'You closed the laptop on night one and slept.',
                message: { from: 'Priya', text: 'you replied at a NORMAL HOUR. who are you', tone: 'friend', thread: 'priya_normal_hour' },
                next: 'early_night',
            },
            {
                text: 'One hour. Set a timer and honour it.',
                hint: 'A compromise that costs a little of both',
                deltas: { mara_trust: 6, burnout: 7, family_bond: -1 },
                log: 'You gave the notes one hour and stopped.',
                next: 'early_night',
            },
        ],
    },
    late_night: {
        lines: [
            { who: 'narration', speaker: 'MONDAY - 3:07 AM', text: 'The monitor is the only light in the flat. Your reflection sits in it, slightly behind you.' },
            { who: 'player', speaker: 'You', text: 'I found the problem. Two problems. I will be useful tomorrow.' },
        ],
        next: null,
        beatOnEnd: 'act2_choice',
        dayLabelOnEnd: 'MONDAY - 3:07 AM',
    },
    early_night: {
        lines: [
            { who: 'narration', speaker: 'MONDAY - 11:20 PM', text: 'The laptop clicks shut. The room gets quieter than you expected.' },
        ],
        next: null,
        beatOnEnd: 'act2_choice',
        dayLabelOnEnd: 'MONDAY - 11:20 PM',
    },
    home_sleep: {
        lines: [
            { who: 'narration', speaker: 'Bed', text: 'You get in without brushing your teeth, which you will regret in a small way tomorrow.' },
            { who: 'narration', speaker: 'Sleep', text: 'You sleep the way you always do lately: instantly, and not enough.' },
        ],
        // Seats the player on the bed and fades the room to black.
        sleep: true,
        next: 'tuesday_morning',
    },
    tuesday_morning: {
        lines: [
            { who: 'narration', speaker: 'TUESDAY - 9:05 AM', text: 'Northlight is loud before you reach the door. Not busy-loud. Wrong-loud.' },
            { who: 'jonah', speaker: 'Jonah', text: 'Do not take your coat off. Theo pushed the wrong branch to the publisher build. The one with the placeholder art and the swearing.' },
        ],
        // The scene moves BEFORE these lines play, so Jonah is really there.
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'TUESDAY - 9:05 AM',
        next: null,
        beatOnEnd: 'act3_collision',
    },

    build_check: {
        lines: [
            { who: 'narration', speaker: 'Your desk', text: 'The publisher build opens on a grey box level and a temp texture that says DO NOT SHIP THIS, THEO.' },
            { who: 'player', speaker: 'You', text: 'Mara will be here in ten minutes. Someone is going to own this.' },
        ],
        next: null,
    },

    theo_crisis: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'It was me. I know it was me. I had two terminals open and I was trying to be fast because everyone is always waiting on art and-' },
            { who: 'theo', speaker: 'Theo', text: 'Mara is walking over. Please. I cannot be the person who did this in my probation.' },
        ],
        choices: [
            {
                text: '"I pushed it. I was in the build last night."',
                hint: 'Take the hit for Theo',
                deltas: { theo_trust: 22, mara_trust: -10, burnout: 9, jonah_closeness: 6 },
                seeds: { protected_theo: true },
                log: 'You took the blame for Theo\'s mistake.',
                message: { from: 'Theo', text: 'i do not know what to say. i owe you. properly.', tone: 'work', thread: 'theo_thanks' },
                next: 'mara_arrives',
            },
            {
                text: '"Tell her yourself. I will stand next to you while you do."',
                hint: 'The risky middle path',
                deltas: { theo_trust: 10, mara_trust: 6, burnout: 4 },
                seeds: { middle_path: true },
                log: 'You made Theo own it - and stood beside him.',
                next: 'mara_arrives',
            },
            {
                text: 'Say nothing. Let it land where it landed.',
                hint: 'Protects you. Costs Theo.',
                deltas: { theo_trust: -25, mara_trust: 3, jonah_closeness: -8, burnout: 2 },
                seeds: { blamed_theo: true },
                log: 'You let Theo take the blame alone.',
                next: 'mara_arrives',
            },
        ],
    },
    mara_arrives: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Right. I have the publisher on at eleven and a build that swears at them.' },
            { who: 'mara', speaker: 'Mara', text: 'I am not interested in who. I am interested in what we say at eleven. Come to my office.' },
        ],
        next: null,
        beatOnEnd: 'act3_verdict',
    },

    mara_verdict: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Two things, and then you can go and be tired somewhere else.' },
            { who: 'mara', speaker: 'Mara', text: 'One: I know what happened this morning. Glass office, remember. Two: you were in the build at three in the morning, or you were not, and both of those tell me something.' },
        ],
        choices: [
            {
                text: '"Ask me the real question."',
                hint: 'Meet her directly',
                deltas: { mara_trust: 8 },
                next: 'to_thursday',
            },
            {
                text: '"I am figuring out what this place costs."',
                hint: 'Honest about yourself',
                deltas: { mara_trust: 5, burnout: -4 },
                next: 'to_thursday',
            },
        ],
    },
    /* --------------------------- ACT 4: THE WEEK --------------------------- */

    to_thursday: {
        lines: [
            { who: 'narration', speaker: 'THURSDAY - 10:20 AM', text: 'Two days pass in the way work days do: too fast to enjoy, too slow to escape.' },
            { who: 'mara', speaker: 'Mara', text: 'Vantage Publishing. Twelfth floor, glass everywhere, coffee that costs more than lunch. We are on at eleven.' },
            { who: 'narration', speaker: 'Travel', text: 'Vantage Publishing is open to you now. Use Travel, top left, to head over.' },
        ],
        next: null,
        beatOnEnd: 'act4_thursday',
        // Stays at the studio; the player travels to the publisher themselves.
        sceneOnEnd: 'studio',
        dayLabelOnEnd: 'THURSDAY - 10:20 AM',
        unlockOnEnd: ['publisher'],
    },

    pub_arrive: {
        lines: [
            { who: 'narration', speaker: 'Vantage Publishing', text: 'The lobby smells of nothing at all. A screen behind reception loops trailers for games that shipped on time.' },
            { who: 'player', speaker: 'You', text: 'Mara is already inside, standing rather than sitting. She does that when she is nervous.' },
        ],
        next: null,
    },
    pub_screen_beat: {
        lines: [
            { who: 'narration', speaker: 'Presentation wall', text: 'Your build, four metres wide. Every soft edge you meant to fix is now the size of a door.' },
        ],
        next: null,
    },
    pub_table_beat: {
        seatAt: 'pub_table',
        lines: [
            { who: 'narration', speaker: 'Review table', text: 'Eight seats. Four of theirs, four of yours, and only two of you came.' },
        ],
        next: null,
    },
    pub_with_mara: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Before they come in. If they ask what changed since Monday, what do you say?' },
        ],
        choices: [
            {
                text: '"That we found the problem and it was not art."',
                hint: 'Back the work',
                deltas: { mara_trust: 8 },
                next: null,
            },
            {
                text: '"That the team is nine weeks tired and still trying."',
                hint: 'Back the people',
                deltas: { mara_trust: 5, jonah_closeness: 8, theo_trust: 6 },
                log: 'You planned to tell the publisher the team was exhausted.',
                next: null,
            },
        ],
    },
    pub_review: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'We have eleven minutes, so I will be blun. Monday\'s build was not a game. It was a mood board that moved.' },
            { who: 'exec', speaker: 'Halvard', text: 'Convince me the next nine weeks are different from the last nine.' },
        ],
        choices: [
            {
                text: '"They are. Here is exactly what was wrong and what we cut."',
                hint: 'Confidence. All eyes on you.',
                deltas: { mara_trust: 12, burnout: 8 },
                log: 'You fronted the publisher review yourself.',
                message: { from: 'Mara', text: 'You did that. I watched Halvard stop looking at his phone.', tone: 'work', thread: 'mara_review' },
                next: 'pub_after',
            },
            {
                text: '"Mara should answer that. It is her project."',
                hint: 'Step back',
                deltas: { mara_trust: -4, burnout: -2 },
                next: 'pub_after',
            },
            {
                text: '"Different because we are going to stop pretending nobody is tired."',
                hint: 'Honest. Risky in this room.',
                deltas: { mara_trust: 7, jonah_closeness: 10, theo_trust: 8, burnout: 4 },
                seeds: { spoke_for_team: true },
                log: 'You told the publisher the truth about the team.',
                message: { from: 'Jonah', text: 'theo told me what you said in there. that mattered.', tone: 'work', thread: 'jonah_noted' },
                next: 'pub_after',
            },
        ],
    },
    pub_after: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'Nine weeks. Show me a vertical slice in three. Do not make me say this twice.' },
            { who: 'mara', speaker: 'Mara', text: 'That is the best outcome we were going to get. Go home. Actually go home.' },
            { who: 'narration', speaker: 'Phone', text: 'Priya: still on for tomorrow?? the lamplighter, 8pm, i have already told the others' },
            { who: 'narration', speaker: 'FRIDAY - 7:50 PM', text: 'You get home, change your shirt twice, and look at the door for a minute.' },
            { who: 'narration', speaker: 'Travel', text: 'The Lamplighter is open to you now. Use Travel, top left, to get there.' },
        ],
        next: null,
        beatOnEnd: 'act4_friday',
        // Ends at HOME, not the bar: the player travels there themselves, so the
        // objective ("travel to the Lamplighter") is actually true.
        sceneOnEnd: 'home',
        dayLabelOnEnd: 'FRIDAY - 7:50 PM',
        unlockOnEnd: ['bar'],
    },

    bar_priya_beat: {
        seatAt: 'bar_priya',
        lines: [
            { who: 'narration', speaker: 'The Lamplighter', text: 'Warm, loud, and smelling of roasted malt, spilled cider, and wet coats. Priya is wedged in the corner booth, two glasses in front of her and one hand already in the air.' },
            { who: 'friend', speaker: 'Priya', text: 'He LIVES. Look at you! Everyone, turn around — this is the genius who moved across three postcodes for a video game and then vanished off the face of the earth.' },
            { who: 'friend', speaker: 'Priya', text: 'Sit down before someone takes the stool. Take a breath. Tell me one true thing about Northlight. Not the LinkedIn PR speech you gave your family.' },
        ],
        choices: [
            {
                text: '"I think I am good at it, Priya. And I think it is slowly eating me alive."',
                hint: 'The raw, honest truth',
                deltas: { friend_closeness: 16, burnout: -8 },
                log: 'You told Priya the unvarnished truth about what the studio is taking out of you.',
                message: { from: 'Priya', text: 'thank you for telling me the real thing tonight. you do not have to be invincible with me. same booth next week.', tone: 'friend', thread: 'priya_real' },
                next: 'bar_deep_talk',
            },
            {
                text: '"It is intense. Good, but intense. Everyone there is obsessed with shipping."',
                hint: 'The measured colleague response',
                deltas: { friend_closeness: 4, burnout: -2 },
                next: 'bar_work_talk',
            },
            {
                text: '"Ask me again in nine weeks after the slice. Right now I just need this beer."',
                hint: 'Deflect and seek refuge',
                deltas: { friend_closeness: 8, burnout: -6 },
                next: 'bar_escape_talk',
            },
        ],
    },
    bar_deep_talk: {
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'I knew it. The minute you walked in, you had that thirty-step stare. Like you were still debugging in your head.' },
            { who: 'friend', speaker: 'Priya', text: 'Listen to me. Northlight was making games before you arrived, and they will make games if you close your laptop at seven. Do not let Mara turn you into furniture.' },
            { who: 'player', speaker: 'You', text: 'It is easy to say from out here. When you are in that open-plan room and everyone is staying late, leaving feels like a confession.' },
            { who: 'friend', speaker: 'Priya', text: 'Then let it be a confession. You are human. Drink your pint before the foam dies.' },
        ],
        next: 'bar_after',
    },
    bar_work_talk: {
        lines: [
            { who: 'friend', speaker: 'Priya', text: '"Obsessed with shipping." That is code for "nobody has eaten vegetables since Tuesday," isn\'t it?' },
            { who: 'player', speaker: 'You', text: 'Theo lives on jelly babies and cold brew. Jonah looks like he is attending his own wake.' },
            { who: 'friend', speaker: 'Priya', text: 'Jesus. And you signed a contract for this. Well, tonight you are off the clock. If your phone vibrates once, it is going in my cider.' },
        ],
        next: 'bar_after',
    },
    bar_escape_talk: {
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'Fair enough. No studio talk. Strictly forbidden by bar law.' },
            { who: 'friend', speaker: 'Priya', text: 'Instead, let me tell you about my landlord\'s new rabbit and why the neighbours called the police.' },
            { who: 'player', speaker: 'You', text: 'For the first time in fourteen days, my shoulders actually drop two inches.' },
        ],
        next: 'bar_after',
    },
    bar_after: {
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'Next round is mine, and then I am queuing the worst eighties power ballad this jukebox has ever heard.' },
            { who: 'player', speaker: 'You', text: 'For two solid hours, nobody mentions vertical slices, publisher slips, or git merge conflicts. It is the only real air you have breathed all week.' },
        ],
        onEnter: { deltas: { burnout: -10, friend_closeness: 6 } },
        next: null,
    },
    bar_counter_beat: {
        lines: [
            { who: 'narration', speaker: 'The bar', text: 'You take a stool. Someone has chalked TONIGHT: NOTHING. IT IS FRIDAY on the board.' },
            { who: 'player', speaker: 'You', text: 'First cold sip. The week goes quiet for a second.' },
        ],
        seatAt: 'bar_counter',
        onEnter: { deltas: { burnout: -3 } },
        next: null,
    },
    bar_jukebox_beat: {
        lines: [
            { who: 'narration', speaker: 'Jukebox', text: 'Three of your songs are already queued. Underneath the glass frame, a handwritten mixtape slip sticks out.' },
            { who: 'player', speaker: 'You', text: 'It is Priya\'s handwriting: "For when the industry forgets who you were before the deadlines."' },
        ],
        choices: [
            {
                text: 'Inspect the cassette card wedged in the slot.',
                hint: 'Hidden Easter Egg: Unlocks an alternate indie perspective',
                deltas: { friend_closeness: 8, burnout: -6 },
                seeds: { found_jukebox_cassette: true },
                log: 'You discovered Priya\'s secret cassette mixtape behind the jukebox.',
                message: { from: 'Priya', text: 'you found the tape! that track 4 was recorded in my garage when we were twenty. do not lose that spark.', tone: 'friend', thread: 'priya_tape' },
                next: null,
            },
            {
                text: 'Drop a coin in and select track 4.',
                hint: 'Just let the brass play',
                deltas: { friend_closeness: 4, burnout: -4 },
                next: null,
            },
        ],
        onEnter: { deltas: { friend_closeness: 2 } },
    },
    bar_pool_beat: {
        lines: [
            { who: 'player', speaker: 'You', text: 'You lose two frames badly and stop thinking about Halvard entirely. Fair trade.' },
        ],
        onEnter: { deltas: { burnout: -5 } },
        next: null,
    },
    bar_window_beat: {
        lines: [
            { who: 'narration', speaker: 'The street', text: 'Rain on glass, buses going somewhere else. The Northlight windows are dark from here. Good.' },
        ],
        next: null,
    },
    friday_end: {
        lines: [
            { who: 'narration', speaker: 'FRIDAY - 11:50 PM', text: 'The bus home. Your ears ring pleasantly. Your phone has one message left unopened.' },
            { who: 'family', speaker: 'Mum', text: 'Sunday. One o\'clock. Your sister is bringing the dog. No pressure. (There is pressure.)' },
            { who: 'narration', speaker: 'SUNDAY - 12:20 PM', text: 'Saturday goes by in a blur of laundry. Sunday arrives the way Sundays do.' },
            { who: 'narration', speaker: 'Travel', text: 'Your family\'s house is open now. Travel there when you are ready.' },
        ],
        next: null,
        beatOnEnd: 'act4_sunday',
        // Ends at HOME. The player travels to the family house themselves.
        sceneOnEnd: 'home',
        dayLabelOnEnd: 'SUNDAY - 12:20 PM',
        unlockOnEnd: ['family'],
    },

    family_mum_beat: {
        lines: [
            { who: 'narration', speaker: "Your family's house", text: 'The latch on the garden gate still sticks in damp weather. The hallway smells of roasted rosemary, beeswax polish, and forty years of laundry.' },
            { who: 'family', speaker: 'Mum', text: 'There he is. Coat off. Shoes on the rack before you track garden mud on the runner. Come into the light where I can see you.' },
            { who: 'family', speaker: 'Mum', text: 'Look at those shadows under your eyes. You have got that grey, sunken look your grandfather had when the docks were on strike.' },
            { who: 'family', speaker: 'Mum', text: 'I am not going to ask about the video games today. I want to know when you last had eight hours of real, honest sleep.' },
        ],
        choices: [
            {
                text: '"Not since I signed the contract, Mum. It has been fourteen-hour days."',
                hint: 'Let the exhaustion show',
                deltas: { family_bond: 16, burnout: -8 },
                log: 'You stopped putting on a brave face and told your mum how tired you really are.',
                next: 'family_mum_sympathy',
            },
            {
                text: '"I am sleeping fine. Honestly, the studio is great and we are hitting our milestones."',
                hint: 'Put up the polite professional shield',
                deltas: { family_bond: -4, burnout: 3 },
                next: 'family_mum_skeptical',
            },
            {
                text: '"Ask me after dinner. The roast smells incredible and I just want to sit down."',
                hint: 'Ground yourself in the moment',
                deltas: { family_bond: 8, burnout: -4 },
                next: 'family_mum_dinner_soon',
            },
        ],
    },
    family_mum_sympathy: {
        lines: [
            { who: 'family', speaker: 'Mum', text: 'I knew it. A mother knows when her child is running on coffee and adrenaline.' },
            { who: 'family', speaker: 'Mum', text: 'Listen to me: no company will love you back. You give them all your blood, and when the project ships they give you a mug with a logo on it.' },
            { who: 'player', speaker: 'You', text: 'Her voice is sharp, but she presses a hot cup of tea into my hands anyway.' },
        ],
        next: null,
    },
    family_mum_skeptical: {
        lines: [
            { who: 'family', speaker: 'Mum', text: '"Milestones." You sound like an insurance pamphlet. You did not use to talk like that.' },
            { who: 'family', speaker: 'Mum', text: 'Your father has been waiting by the window since noon. At least go in and say hello properly before dinner.' },
        ],
        next: null,
    },
    family_mum_dinner_soon: {
        lines: [
            { who: 'family', speaker: 'Mum', text: 'Yorkshire puddings have five minutes left. Iris is in the lounge pretending she didn\'t miss you.' },
            { who: 'player', speaker: 'You', text: 'The warmth from the oven fills the kitchen. The tension in my neck eases for the first time in days.' },
        ],
        next: null,
    },
    family_sister_beat: {
        lines: [
            { who: 'sister', speaker: 'Iris', text: 'Well, well. The prodigal game developer descends from his ivory tower.' },
            { who: 'sister', speaker: 'Iris', text: 'Look at you in your little grown-up tech jacket. Mum has been hovering by the oven since nine in the morning checking the crackling every six minutes.' },
            { who: 'sister', speaker: 'Iris', text: 'Dad wouldn\'t admit it, but he asked twice if your train was on time. So, are you actually staying for tea, or do you have an urgent pixel emergency?' },
        ],
        choices: [
            {
                text: '"No pixel emergencies today. I am staying until the last potato is gone."',
                hint: 'Commit to your sister',
                deltas: { family_bond: 12, burnout: -5 },
                next: 'sister_warm',
            },
            {
                text: '"It is a major launch year, Iris. I do what I have to do."',
                hint: 'Defend the job',
                deltas: { family_bond: -6, burnout: 2 },
                next: 'sister_sharp',
            },
        ],
    },
    sister_warm: {
        lines: [
            { who: 'sister', speaker: 'Iris', text: 'Good. Because I have three weeks of family gossip to unload and Dad cannot hear half of it anyway.' },
            { who: 'sister', speaker: 'Iris', text: 'It\'s good to see your face. Seriously. Don\'t be such a stranger.' },
        ],
        next: null,
    },
    sister_sharp: {
        lines: [
            { who: 'sister', speaker: 'Iris', text: '"Major launch year." You sound like you swallowed a corporate handbook.' },
            { who: 'sister', speaker: 'Iris', text: 'Just don\'t check your phone under the table. Mum will confiscate it and put it in the butter dish.' },
        ],
        next: null,
    },
    family_kitchen_beat: {
        lines: [
            { who: 'narration', speaker: 'Kitchen', text: 'You dry plates badly and your mum lets you, which is its own kind of forgiveness.' },
        ],
        onEnter: { deltas: { family_bond: 5, burnout: -4 } },
        next: null,
    },
    family_photos_beat: {
        lines: [
            { who: 'narration', speaker: 'The mantel', text: 'Four frames. You at nine. Iris in a graduation gown. Your dad squinting proudly beside an old sailboat. An empty fifth frame resting against the brick.' },
            { who: 'player', speaker: 'You', text: 'There is a faded index card tucked behind Dad\'s sailing photo.' },
        ],
        choices: [
            {
                text: 'Pull out the card and read Dad\'s penciled notes from thirty years ago.',
                hint: 'Easter Egg: Dad\'s early engineering logs',
                deltas: { family_bond: 10, burnout: -5 },
                seeds: { found_family_photo_note: true },
                log: 'You found your father\'s note behind the mantelpiece photo: "The bridge is built for the crossing, not for the architect. Go home on time."',
                message: { from: 'Dad', text: 'Saw you looking at the mantel. That boat was thirty-two weekends of timber work. Worth every splinter.', tone: 'family', thread: 'dad_boat' },
                next: null,
            },
            {
                text: 'Straighten the frames respectfully and let them rest.',
                hint: 'Quiet contemplation',
                deltas: { family_bond: 4, burnout: -2 },
                next: null,
            },
        ],
        next: null,
    },
    family_dinner: {
        seatAt: 'family_table',
        lines: [
            { who: 'family', speaker: 'Mum', text: 'Sit. Everyone sit. It is going cold and I will not be responsible for what I say.' },
            { who: 'narration', speaker: 'Sunday dinner', text: 'Six plates. Five people. The dog under the table with strategic patience.' },
            { who: 'family', speaker: 'Mum', text: 'Right. Before anyone eats. Are you going to be here next month, or am I writing it in pencil again?' },
        ],
        choices: [
            {
                text: '"Pen. I will make it work."',
                hint: 'A promise with a cost',
                deltas: { family_bond: 16, mara_trust: -4 },
                seeds: { chose_family: true },
                log: 'You promised next month in pen, knowing what it will cost at work.',
                message: { from: 'Mum', text: 'Pen it is. I have already told the neighbours. x', tone: 'family', thread: 'mum_pen' },
                next: 'epilogue',
            },
            {
                text: '"Pencil. I would rather be honest than sorry."',
                hint: 'Honest. It still stings.',
                deltas: { family_bond: 2, burnout: -3 },
                log: 'You chose honesty over a promise you might break.',
                next: 'epilogue',
            },
            {
                text: '"I will be here. And I am putting my phone in the drawer."',
                hint: 'Present, not just attending',
                deltas: { family_bond: 20, burnout: -8, mara_trust: -6 },
                seeds: { chose_family: true, phone_in_drawer: true },
                log: 'You put your phone in the drawer at Sunday dinner.',
                message: { from: 'Iris', text: 'the phone thing. mum has not stopped talking about it.', tone: 'family', thread: 'iris_drawer' },
                next: 'epilogue',
            },
        ],
    },

    /* ============= EPISODE 3: "THE PERSON IN CHARGE" ============= */

    ep3_open: {
        lines: [
            { who: 'narration', speaker: 'Sleep', text: 'Nine months of production ahead. You sleep like someone standing at the bottom of a hill.' },
        ],
        sleep: true,
        next: 'ep3_monday',
    },
    ep3_monday: {
        lines: [
            { who: 'narration', speaker: 'EPISODE 3 — THE PERSON IN CHARGE', text: 'Four months into production. Atlas has a ship date, a marketing plan, and a hole where its second act should be.' },
            { who: 'narration', speaker: 'MONDAY - 8:52 AM', text: 'The countdown is gone from the whiteboard. In its place: an org chart, and your name is on it with a line underneath.' },
            { who: 'player', speaker: 'You', text: 'A line under your name means somebody hangs off it.' },
        ],
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'MONDAY - 8:52 AM',
        next: null,
        beatOnEnd: 'ep3_lead',
        unlockOnEnd: ['studio', 'rooftop', 'home', 'bar', 'family'],
    },

    ep3_mara_offer: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Sit. I am going to say a sentence and you are going to hate the second half of it.' },
            { who: 'mara', speaker: 'Mara', text: 'You are leading the second act. Nadia reports to you from this morning, and the third-act cut we made is now yours to justify.' },
            { who: 'mara', speaker: 'Mara', text: 'She is twenty-three, she is good, and she has never shipped anything. You know exactly what she is walking into, because you watched it happen to Theo.' },
        ],
        choices: [
            {
                text: '"Then I will be the person he did not have."',
                hint: 'Take it, and mean it',
                deltas: { mara_trust: 10, burnout: 6, nadia_trust: 8 },
                seeds: { took_the_lead: true },
                log: 'You took the lead, intending to protect the person under you.',
                next: 'ep3_offer_after',
            },
            {
                text: '"Give it to Theo. He has earned it and I have not."',
                hint: 'Hand it away',
                deltas: { mara_trust: -8, theo_trust: 20, burnout: -6 },
                seeds: { refused_lead: true, promoted_theo: true },
                log: 'You gave the lead role to Theo instead of taking it.',
                message: { from: 'Theo', text: 'mara told me what you said. i do not know what to do with that.', tone: 'work', thread: 'theo_thanks' },
                next: 'ep3_offer_after',
            },
            {
                text: '"I will take it. But I want in writing what I can say no to."',
                hint: 'Take it with terms',
                deltas: { mara_trust: 6, burnout: 2, jonah_closeness: 8 },
                seeds: { took_the_lead: true, held_the_line: true },
                log: 'You took the lead and negotiated the right to refuse.',
                next: 'ep3_offer_after',
            },
        ],
    },
    ep3_offer_after: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Right. She is at the front desk with a laptop bag and a face like the first day of school.' },
            { who: 'mara', speaker: 'Mara', text: 'One more thing, then I will stop. Whatever you do with her, she will do to somebody in five years. That is the whole job.' },
        ],
        next: null,
    },

    ep3_nadia_intro: {
        seatAt: 'laptop',
        lines: [
            { who: 'nadia', speaker: 'Nadia', text: 'Hi! Hello. I have read all the documentation. All of it. I do not think that was the right call but it is done now.' },
            { who: 'nadia', speaker: 'Nadia', text: 'I know the second act is the hard one. I asked to be on it, so — I would rather be told things straight than kindly, if that is an option.' },
        ],
        choices: [
            {
                text: '"Straight, then: it is broken and nobody knows why yet."',
                hint: 'Trust her with the truth',
                deltas: { nadia_trust: 14, mara_trust: 3 },
                log: 'You told Nadia the truth about the second act on day one.',
                message: { from: 'Nadia', text: 'thank you for not managing me. i can work with broken. i cannot work with vague.', tone: 'work', thread: 'nadia_first' },
                next: 'ep3_to_people',
            },
            {
                text: '"Straight and kind are not opposites. Let me show you the build."',
                hint: 'Both',
                deltas: { nadia_trust: 10, burnout: 3 },
                next: 'ep3_to_people',
            },
            {
                text: '"Read the build. Come back with three questions."',
                hint: 'Efficient. A little cold.',
                deltas: { nadia_trust: 2, burnout: -3 },
                next: 'ep3_to_people',
            },
        ],
    },

    ep3_to_people: {
        lines: [
            { who: 'narration', speaker: 'THREE WEEKS LATER', text: 'The second act has a shape now. It also has forty-one bugs, a slipping date, and three people who each need something from you today.' },
        ],
        next: null,
        beatOnEnd: 'ep3_people',
        dayLabelOnEnd: 'THURSDAY - 6:40 PM',
    },

    ep3_nadia_stuck: {
        seatAt: 'laptop',
        lines: [
            { who: 'nadia', speaker: 'Nadia', text: 'I have been on this one thing for four days. Four. I keep nearly asking you and then not, because you are always in a meeting about me.' },
            { who: 'nadia', speaker: 'Nadia', text: 'Everyone here works until eight. I have started staying too. Nobody told me to. That is the part that worries me.' },
        ],
        choices: [
            {
                text: '"Go home at six. I will fix the culture, not you."',
                hint: 'Take the weight yourself',
                deltas: { nadia_trust: 18, burnout: 12, mara_trust: -3 },
                seeds: { protected_jonah: true },
                log: 'You sent Nadia home at six and absorbed the difference yourself.',
                next: null,
            },
            {
                text: '"Sit with me for an hour. We will unstick it together."',
                hint: 'Teach, which costs time',
                deltas: { nadia_trust: 12, burnout: 6 },
                next: null,
            },
            {
                text: '"Everyone stays late in production. That is the deal."',
                hint: 'The sentence that was said to you',
                deltas: { nadia_trust: -14, burnout: 4, mara_trust: 2 },
                seeds: { made_theo_crunch: true },
                log: 'You told Nadia that staying late was simply the deal.',
                next: null,
            },
        ],
    },
    ep3_jonah_out: {
        lines: [
            { who: 'jonah', speaker: 'Jonah', text: 'I have got an offer. Smaller studio, less money, forty hours and they mean it.' },
            { who: 'jonah', speaker: 'Jonah', text: 'I am telling you before Mara because you are the one who will have to cover it, and because I would like one person here to say the honest thing.' },
        ],
        choices: [
            {
                text: '"Take it. You have given this place enough."',
                hint: 'Let him go well',
                deltas: { jonah_closeness: 16, burnout: 8, mara_trust: -4 },
                log: 'You told Jonah to take the other offer.',
                next: null,
            },
            {
                text: '"Stay six weeks. Let me try to make this the place you want."',
                hint: 'Ask for time you may not deliver',
                deltas: { jonah_closeness: 6, burnout: 10, mara_trust: 4 },
                next: null,
            },
            {
                text: '"If you go now, the second act ships broken."',
                hint: 'True. Also a weapon.',
                deltas: { jonah_closeness: -16, burnout: 4 },
                log: 'You used the project to guilt Jonah into staying.',
                next: null,
            },
        ],
    },
    ep3_theo_ambition: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'Can I be blunt? I have been here two years. You have been here seven months and you are my lead.' },
            { who: 'theo', speaker: 'Theo', text: 'I am not angry. I want to know what you did, so I can do it. Or I want you to tell me it was luck, which is also fine.' },
        ],
        choices: [
            {
                text: '"Partly luck, partly saying the hard thing out loud."',
                hint: 'Honest about both',
                deltas: { theo_trust: 14 },
                log: 'You told Theo the truth about how you got the job.',
                next: null,
            },
            {
                text: '"I will put you forward for the next one. That is a promise."',
                hint: 'A promise with a date on it',
                deltas: { theo_trust: 18, mara_trust: -3, burnout: 3 },
                seeds: { promoted_theo: true },
                log: 'You promised Theo the next lead role.',
                next: null,
            },
            {
                text: '"You are not ready. I would be lying if I said otherwise."',
                hint: 'Brutal, possibly true',
                deltas: { theo_trust: -20, mara_trust: 4 },
                log: 'You told Theo to his face that he was not ready.',
                next: null,
            },
        ],
    },
    ep3_headcount: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Budget review. I have to give back one headcount from your side of the org chart by Friday.' },
            { who: 'mara', speaker: 'Mara', text: 'Nadia is the newest. Theo is the most expensive. Jonah has one foot out of the door and I know you know that.' },
            { who: 'mara', speaker: 'Mara', text: 'I am not deciding this. You are. That is what the line under your name means.' },
        ],
        choices: [
            {
                text: '"Take my headcount. I will do both jobs."',
                hint: 'Nobody goes. You pay for it.',
                deltas: { burnout: 22, mara_trust: 8, nadia_trust: 12, theo_trust: 10, jonah_closeness: 10 },
                seeds: { protected_jonah: true },
                log: 'You gave up your own headcount and did two jobs.',
                next: 'ep3_headcount_after',
            },
            {
                text: '"Jonah. He has an offer and he wants to take it."',
                hint: 'The pragmatic answer',
                deltas: { jonah_closeness: -10, mara_trust: 6, burnout: 4, theo_trust: -4 },
                log: 'You gave up Jonah\'s role in the budget review.',
                next: 'ep3_headcount_after',
            },
            {
                text: '"No. Make the budget come out of something else."',
                hint: 'Push back upward',
                deltas: { mara_trust: -6, jonah_closeness: 8, nadia_trust: 6, burnout: 6 },
                seeds: { held_the_line: true },
                log: 'You refused to give up anyone from your team.',
                next: 'ep3_headcount_after',
            },
        ],
    },
    ep3_headcount_after: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Right. I will write it up.' },
            { who: 'narration', speaker: 'Phone', text: 'Your phone has been buzzing in your pocket for six minutes. IRIS — four missed calls.' },
        ],
        next: null,
    },
    ep3_iris_call: {
        lines: [
            { who: 'sister', speaker: 'Iris', text: 'Where have you BEEN. No — do not answer that, I know where you have been.' },
            { who: 'sister', speaker: 'Iris', text: 'Dad went in on Tuesday. St Bride\'s, Ward 6. It is his heart. He is stable, it is not an emergency, and I am still ringing you four times.' },
            { who: 'sister', speaker: 'Iris', text: 'Mum has been in that chair for two days. I am asking you to come. Tonight, not Sunday.' },
        ],
        choices: [
            {
                text: '"I am leaving now. Tell Mum I am on my way."',
                hint: 'Go. Immediately.',
                deltas: { family_bond: 20, burnout: -4, mara_trust: -4 },
                seeds: { was_at_the_ward: true },
                log: 'You left work mid-week and went straight to the ward.',
                next: 'ep3_to_ward',
            },
            {
                text: '"Two hours. I have to hand something over first."',
                hint: 'Nearly right',
                deltas: { family_bond: 4, burnout: 8 },
                seeds: { was_at_the_ward: true },
                log: 'You went to the ward two hours later than you could have.',
                next: 'ep3_to_ward',
            },
            {
                text: '"Tuesday? Iris, why is this the first I am hearing of it?"',
                hint: 'Turn it around',
                deltas: { family_bond: -10, burnout: 6 },
                seeds: { missed_the_ward: true },
                log: 'You made your dad\'s heart attack about who told you.',
                next: 'ep3_to_ward',
            },
        ],
    },
    ep3_to_ward: {
        lines: [
            { who: 'narration', speaker: 'Travel', text: 'St Bride\'s, Ward 6. Visiting closes at nine. Travel there when you are ready.' },
        ],
        next: null,
        beatOnEnd: 'ep3_ward',
        sceneOnEnd: 'home',
        dayLabelOnEnd: 'THURSDAY - 7:55 PM',
        unlockOnEnd: ['hospital'],
    },

    ep3_dad: {
        seatAt: 'ward_dad',
        lines: [
            { who: 'narration', speaker: 'Ward 6', text: 'Four beds, two occupied. A monitor doing its small green arithmetic beside the one that matters.' },
            { who: 'family', speaker: 'Dad', text: 'There he is. Do not look at me like that, I have had a better week than the man in bed two.' },
            { who: 'family', speaker: 'Dad', text: 'Sit down. Your mother has told me about the promotion four times and I would like to hear it from you once.' },
        ],
        choices: [
            {
                text: 'Tell him about the job. All of it, properly.',
                hint: 'Give him what he asked for',
                deltas: { family_bond: 16, burnout: -8 },
                log: 'You sat and told your dad about the job, properly.',
                next: 'ep3_dad_after',
            },
            {
                text: '"It is just a job, Dad. How are you?"',
                hint: 'Deflect toward him',
                deltas: { family_bond: 8, burnout: -4 },
                next: 'ep3_dad_after',
            },
            {
                text: 'Say nothing for a while. Just sit.',
                hint: 'Sometimes that is the whole visit',
                deltas: { family_bond: 12, burnout: -12 },
                log: 'You sat with your dad in silence for an hour.',
                next: 'ep3_dad_after',
            },
        ],
    },
    ep3_dad_after: {
        lines: [
            { who: 'family', speaker: 'Dad', text: 'Good. That is what I wanted.' },
            { who: 'family', speaker: 'Dad', text: 'One thing, while your mother is getting tea. Do not do what I did. Forty-one years and I can tell you every project and almost nothing else.' },
            { who: 'player', speaker: 'You', text: 'He says it lightly, the way people say things they have rehearsed.' },
        ],
        next: null,
    },
    ep3_mum_ward: {
        lines: [
            { who: 'family', speaker: 'Mum', text: 'I am fine. I have a cardigan and a crossword and the nurses are lovely.' },
            { who: 'family', speaker: 'Mum', text: 'Do not tell me to go home. Tell me something about your week instead. Anything. I have run out of things to think about.' },
        ],
        choices: [
            {
                text: 'Tell her about Nadia, and about being frightened of it.',
                hint: 'Let her be your mum',
                deltas: { family_bond: 14, burnout: -6 },
                log: 'You told your mum you were frightened of being someone\'s boss.',
                next: null,
            },
            {
                text: '"I will sit here. You go and sleep in a real bed."',
                hint: 'Swap places',
                deltas: { family_bond: 18, burnout: 10 },
                log: 'You took your mum\'s place at the bedside overnight.',
                next: null,
            },
        ],
    },
    ep3_nurse: {
        lines: [
            { who: 'exec', speaker: 'Nurse Bello', text: 'He is doing well. Genuinely — I would not say it if he was not.' },
            { who: 'exec', speaker: 'Nurse Bello', text: 'Your mum has been here since Tuesday. Somebody needs to make her leave, and it will not be me.' },
        ],
        next: null,
    },
    ep3_ward_window: {
        lines: [
            { who: 'narration', speaker: 'The window', text: 'The car park, the ring road, and eleven floors of Northlight lit up somewhere past it. Somebody is still at their desk.' },
        ],
        next: null,
    },
    ep3_corridor: {
        seatAt: 'ward_corridor',
        lines: [
            { who: 'narration', speaker: 'The corridor', text: 'Vending-machine light. A phone with nine notifications, all of them work.' },
            { who: 'mara', speaker: 'Mara (message)', text: 'Halvard has seen the slip. He wants a call at nine tomorrow and he wants a name attached to it. Where are you?' },
        ],
        choices: [
            {
                text: '"My dad is in hospital. I will be there at nine."',
                hint: 'Tell her the truth',
                deltas: { mara_trust: 10, burnout: -4, family_bond: 4 },
                seeds: { told_mara_about_dad: true },
                log: 'You told Mara your dad was in hospital.',
                message: { from: 'Mara', text: 'Then be there at ten, not nine. I will hold Halvard for an hour. Go back inside.', tone: 'work', thread: 'mara_dad' },
                next: 'ep3_to_reckoning',
            },
            {
                text: '"Held up. I will be there at nine."',
                hint: 'Keep the two lives separate',
                deltas: { mara_trust: 2, burnout: 10, family_bond: -4 },
                seeds: { hid_dad_from_work: true },
                log: 'You hid your dad\'s hospital stay from work.',
                next: 'ep3_to_reckoning',
            },
            {
                text: 'Put the phone in your pocket and go back in.',
                hint: 'Answer nothing tonight',
                deltas: { mara_trust: -6, burnout: -10, family_bond: 12 },
                seeds: { phone_in_drawer: true },
                log: 'You ignored work entirely for one evening.',
                next: 'ep3_to_reckoning',
            },
        ],
    },
    ep3_to_reckoning: {
        lines: [
            { who: 'narration', speaker: 'FRIDAY - 9:40 AM', text: 'Visiting hours end. Sleep happens somewhere. Then a lift, a lobby, and a room with a long table in it.' },
            { who: 'narration', speaker: 'Travel', text: 'Vantage Publishing. Halvard is waiting, and so is the question of whose name goes on the slip.' },
        ],
        next: null,
        beatOnEnd: 'ep3_reckoning',
        sceneOnEnd: 'home',
        dayLabelOnEnd: 'FRIDAY - 9:40 AM',
        unlockOnEnd: ['publisher'],
    },

    ep3_mara_before: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'He will ask who owns the slip. There is a correct answer and a true answer and they are not the same one.' },
            { who: 'mara', speaker: 'Mara', text: 'The correct answer is a name. The true answer is that I cut the third act in February, and that decision was mine.' },
        ],
        choices: [
            {
                text: '"Then say that. I will back you."',
                hint: 'Share it',
                deltas: { mara_trust: 12, burnout: 4 },
                next: null,
            },
            {
                text: '"Let me take it. You cannot be the one who slipped twice."',
                hint: 'Shield her',
                deltas: { mara_trust: 16, burnout: 12, nadia_trust: -4 },
                log: 'You offered to take the blame for the slip to protect Mara.',
                next: null,
            },
        ],
    },
    ep3_slip: {
        lines: [
            { who: 'narration', speaker: 'The wall', text: 'A burndown chart with a line that stopped burning down in week nine. Somebody has annotated it in red.' },
        ],
        next: null,
    },
    ep3_halvard: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'Eleven weeks late. I have a marketing spend that assumed otherwise and a board that reads charts.' },
            { who: 'exec', speaker: 'Halvard', text: 'I am not going to shout. I am going to ask one question and write down the answer. Whose slip is this?' },
        ],
        choices: [
            {
                text: '"Mine. I led the second act."',
                hint: 'Take it. All of it.',
                deltas: { mara_trust: 14, burnout: 16, nadia_trust: 8, theo_trust: 6 },
                seeds: { took_the_lead: true },
                log: 'You put your own name on the slip in front of the publisher.',
                message: { from: 'Mara', text: 'You did not have to do that. I will not forget that you did.', tone: 'work', thread: 'mara_review' },
                next: 'ep3_halvard_after',
            },
            {
                text: '"It is a scope decision from February. That is a studio call, not a person."',
                hint: 'Refuse the premise',
                deltas: { mara_trust: 8, jonah_closeness: 12, nadia_trust: 12, burnout: 6 },
                seeds: { held_the_line: true, spoke_for_team: true },
                log: 'You refused to give the publisher a name for the slip.',
                next: 'ep3_halvard_after',
            },
            {
                text: 'Name the person who missed the date.',
                hint: 'The answer he asked for',
                deltas: { mara_trust: 4, nadia_trust: -30, theo_trust: -18, jonah_closeness: -16, burnout: 4 },
                log: 'You gave the publisher a name. It was not yours.',
                next: 'ep3_halvard_after',
            },
        ],
    },
    ep3_halvard_after: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'Hm.' },
            { who: 'exec', speaker: 'Halvard', text: 'New date. And a producer, from our side, embedded in your studio from Monday. That is not a punishment, it is a condition.' },
            { who: 'mara', speaker: 'Mara', text: 'A Vantage producer. In the building. Sitting where Jonah sits.' },
        ],
        next: null,
    },
    ep3_priya_after: {
        seatAt: 'bar_priya',
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'You look like someone who has just been handed a bigger version of the thing that was already too big.' },
            { who: 'friend', speaker: 'Priya', text: 'How is your dad? And do not do the thing where you answer about work.' },
        ],
        choices: [
            {
                text: '"Frightened. He told me not to become him."',
                hint: 'Say the real thing',
                deltas: { friend_closeness: 16, burnout: -10 },
                log: 'You told Priya what your dad said to you.',
                next: null,
            },
            {
                text: '"Stable. That is the word everyone keeps using."',
                hint: 'Half of it',
                deltas: { friend_closeness: 6, burnout: -4 },
                next: null,
            },
        ],
    },
    ep3_ward_visit: {
        seatAt: 'ward_dad',
        lines: [
            { who: 'family', speaker: 'Dad', text: 'You came back. Sit down, there is a crossword and I am stuck on nine across.' },
        ],
        onEnter: { deltas: { family_bond: 4, burnout: -5 } },
        next: null,
    },
    ep3_close: {
        lines: [
            { who: 'narration', speaker: 'FRIDAY - 11:30 PM', text: 'A Vantage producer starts Monday. Your dad comes home Wednesday, probably. Nadia has sent you three questions, numbered.' },
            { who: 'player', speaker: 'You', text: 'A line under my name. Three people hanging off it, and a man in Ward 6 who spent forty-one years doing exactly this.' },
            { who: 'narration', speaker: 'The email', text: 'VANTAGE — EMBEDDED PRODUCER, EFFECTIVE MONDAY. You have read the name four times, because you know it.' },
            { who: 'narration', speaker: 'END OF EPISODE 3', text: 'It is Priya\'s surname. Not Priya. Her sister.' },
        ],
        next: null,
        beatOnEnd: 'ep3_epilogue',
        unlockOnEnd: ['studio', 'home', 'bar', 'family', 'publisher', 'rooftop', 'clinic', 'hospital'],
    },

    /* ==================== EPISODE 2: "THE SLICE" ==================== */

    ep2_open: {
        lines: [
            { who: 'narration', speaker: 'Sleep', text: 'You sleep like someone who has finally put something down.' },
        ],
        sleep: true,
        next: 'ep2_monday',
    },
    ep2_monday: {
        lines: [
            { who: 'narration', speaker: 'EPISODE 2 — THE SLICE', text: 'Six weeks. That is what Halvard gave you. Five now, if you are honest about the Monday.' },
            { who: 'narration', speaker: 'MONDAY - 8:48 AM', text: 'Northlight smells of new coffee and old panic. Somebody has put a countdown on the whiteboard.' },
            { who: 'player', speaker: 'You', text: 'Thirty-four days. Written in marker, which is somehow worse than a spreadsheet.' },
        ],
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'MONDAY - 8:48 AM',
        next: null,
        beatOnEnd: 'ep2_return',
        unlockOnEnd: ['studio', 'rooftop'],
    },

    ep2_mara_plan: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Good. You are here. Close the door, the glass is still decorative.' },
            { who: 'mara', speaker: 'Mara', text: 'Thirty-four days to a vertical slice. I have costed three ways to do it and I hate all of them.' },
            { who: 'mara', speaker: 'Mara', text: 'Option one: everyone works weekends. Option two: we cut the third act entirely. Option three: I go back to Halvard and ask for two more weeks, and he learns we cannot hold a date.' },
        ],
        choices: [
            {
                text: '"Cut the third act. Ship something that works."',
                hint: 'Protects the team. Costs the game.',
                deltas: { mara_trust: 6, jonah_closeness: 10, theo_trust: 8, burnout: 3 },
                seeds: { cut_scope: true },
                log: 'You argued for cutting scope instead of burning the team.',
                next: 'ep2_mara_after',
            },
            {
                text: '"Weekends. Six of them. Then we never do this again."',
                hint: 'Hits the date. Hits everyone.',
                deltas: { mara_trust: 12, burnout: 20, jonah_closeness: -8, theo_trust: -5, family_bond: -8, friend_closeness: -6 },
                seeds: { crunched_team: true },
                log: 'You backed six weekends of crunch.',
                message: { from: 'Jonah', text: 'six weekends. i have a kid, mate. i know it was not only your call.', tone: 'work', thread: 'jonah_weekends' },
                next: 'ep2_mara_after',
            },
            {
                text: '"Ask Halvard. Let him own the date he set."',
                hint: 'Honest upward. Risky.',
                deltas: { mara_trust: 4, jonah_closeness: 6, burnout: -2 },
                seeds: { asked_for_time: true },
                log: 'You pushed Mara to go back to the publisher.',
                next: 'ep2_mara_after',
            },
        ],
    },
    ep2_mara_after: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Right. Then that is what we do, and I will say it was mine.' },
            { who: 'mara', speaker: 'Mara', text: 'One more thing. Watch Theo. He has been in before me every day this month and I do not think he is sleeping.' },
        ],
        next: null,
        beatOnEnd: 'ep2_crunch',
        dayLabelOnEnd: 'WEDNESDAY - 7:20 PM',
    },

    ep2_jonah_state: {
        lines: [
            { who: 'jonah', speaker: 'Jonah', text: 'You came back. People do not always, after a first fortnight like that.' },
            { who: 'jonah', speaker: 'Jonah', text: 'I have got nursery pickup at five and a build that does not care. So. Ask me quickly.' },
        ],
        choices: [
            {
                text: '"Go at five. I will cover the evening pass."',
                hint: 'Take his weight',
                deltas: { jonah_closeness: 12, burnout: 9 },
                log: 'You covered Jonah\'s evening so he could do nursery pickup.',
                next: null,
            },
            {
                text: '"What would actually help? Not the polite answer."',
                hint: 'Ask properly',
                deltas: { jonah_closeness: 8, burnout: 2 },
                next: null,
            },
        ],
    },
    ep2_theo_state: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'I am fine. I am completely fine. I have done the whole environment pass twice because the first one was not right.' },
            { who: 'theo', speaker: 'Theo', text: 'It is fine. It was not right. So I did it again.' },
        ],
        choices: [
            {
                text: '"When did you last leave this building?"',
                hint: 'Notice it out loud',
                deltas: { theo_trust: 10, burnout: 2 },
                log: 'You noticed Theo was not going home.',
                next: null,
            },
            {
                text: '"Show me the first one. I bet it was fine."',
                hint: 'Take the work seriously',
                deltas: { theo_trust: 7 },
                next: null,
            },
            {
                text: '"Good. Keep going, we need it."',
                hint: 'What he wants to hear. Not what he needs.',
                deltas: { theo_trust: -6, burnout: 3, mara_trust: 3 },
                seeds: { pushed_theo: true },
                log: 'You told Theo to keep going.',
                next: null,
            },
        ],
    },
    ep2_desk: {
        seatAt: 'laptop',
        lines: [
            { who: 'narration', speaker: 'Your desk', text: 'The countdown is on your second monitor now. Someone made it a browser extension. Someone should be stopped.' },
        ],
        next: null,
    },
    ep2_roof_edge: {
        seatAt: 'roof_edge',
        lines: [
            { who: 'narration', speaker: 'The roof', text: 'Eleven floors of other people\'s evenings. Somewhere down there a bus is going somewhere that is not here.' },
            { who: 'player', speaker: 'You', text: 'Tucked between two gravel pavers by the air intake is a weathered binder labelled \"NORTHLIGHT FOUNDING CHARTER - 2018\".' },
        ],
        choices: [
            {
                text: 'Read Mara and Jonah\'s original founding vision.',
                hint: 'Hidden Easter Egg: Unlocks Worker Co-op Alternate Timeline',
                deltas: { mara_trust: 6, jonah_closeness: 8, burnout: -6 },
                seeds: { found_rooftop_manifesto: true, unlocked_coop_timeline: true },
                log: 'You discovered Northlight\'s original founding charter: "Owned by those who build it. No board, no crunch."',
                message: { from: 'Jonah', text: 'You found the charter? Mara and I wrote that before Vantage bought our debt. Keep that between us.', tone: 'work', thread: 'jonah_charter' },
                next: null,
            },
            {
                text: 'Lean against the rail and watch the evening skyline in silence.',
                hint: 'Quiet decompression',
                deltas: { burnout: -8 },
                next: null,
            },
        ],
        onEnter: { deltas: { burnout: -5 } },
        next: null,
    },
    ep2_roof_bench: {
        seatAt: 'roof_bench',
        lines: [
            { who: 'narration', speaker: 'The bench', text: 'Someone has grown tomatoes up here, in buckets, against all sense. Two of them are actually red.' },
        ],
        onEnter: { deltas: { burnout: -6 } },
        next: null,
    },

    /* ---- Crunch: everyone needs you at once ---- */

    ep2_crunch_mara: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Wednesday. Nineteen days. I need one thing from you and you will not like it.' },
            { who: 'mara', speaker: 'Mara', text: 'The third-act level is not going to make it. Someone has to tell Theo that four weeks of his work is being cut, and it cannot come from me or he will hear a verdict.' },
        ],
        choices: [
            {
                text: '"I will tell him. Tonight, properly, not in a corridor."',
                hint: 'Carry it yourself',
                deltas: { mara_trust: 10, theo_trust: 6, burnout: 8 },
                seeds: { told_theo_himself: true },
                log: 'You agreed to tell Theo his work was being cut.',
                next: 'ep2_crunch_after',
            },
            {
                text: '"Tell him together. He should see it is a decision, not a punishment."',
                hint: 'Share it',
                deltas: { mara_trust: 7, theo_trust: 12, burnout: 4 },
                seeds: { middle_path: true },
                log: 'You insisted on telling Theo alongside Mara.',
                next: 'ep2_crunch_after',
            },
            {
                text: '"No. That is a director\'s job and you know it."',
                hint: 'Refuse. It will cost you.',
                deltas: { mara_trust: -12, burnout: -4, jonah_closeness: 4 },
                seeds: { refused_mara: true },
                log: 'You refused to deliver Mara\'s bad news for her.',
                next: 'ep2_crunch_after',
            },
        ],
    },
    ep2_crunch_after: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Fine. Noted. Go home at some point, that is not a suggestion I am able to enforce.' },
            { who: 'narration', speaker: 'Phone', text: 'Three things want you tonight: the build, your mum, and a seat Priya is holding at the Lamplighter.' },
            { who: 'narration', speaker: 'Choose', text: 'You have one evening. Whatever you pick, the others will notice.' },
        ],
        next: null,
    },
    ep2_roof_jonah: {
        lines: [
            { who: 'jonah', speaker: 'Jonah', text: 'I come up here to not be findable for ten minutes. You found me, so that is that ruined.' },
            { who: 'jonah', speaker: 'Jonah', text: 'Can I say something ugly? I have done four of these. Every single time somebody stands where you are standing and says it will be different after ship.' },
        ],
        choices: [
            {
                text: '"I am not going to say that."',
                hint: 'Don\'t lie to him',
                deltas: { jonah_closeness: 14, burnout: -3 },
                log: 'You refused to promise Jonah it would be different after ship.',
                message: { from: 'Jonah', text: 'thanks for not saying the thing. genuinely.', tone: 'work', thread: 'jonah_noted' },
                next: null,
            },
            {
                text: '"Then help me make this the one where it is."',
                hint: 'Ask him to try anyway',
                deltas: { jonah_closeness: 8, mara_trust: 4, burnout: 3 },
                next: null,
            },
        ],
    },
    ep2_night_work: {
        seatAt: 'home_desk',
        lines: [
            { who: 'narration', speaker: 'Home, 11:40 PM', text: 'You take the build home. The flat is the temperature of a place nobody has been in all day.' },
            { who: 'player', speaker: 'You', text: 'Two hours. Three. The countdown extension is on this monitor too. Of course it is.' },
        ],
        onEnter: {
            deltas: { mara_trust: 9, burnout: 16, family_bond: -6, friend_closeness: -6 },
            seeds: { worked_weekend: true },
            log: 'You spent the crunch evening working at home.',
        },
        next: null,
    },
    ep2_mum_calls: {
        lines: [
            { who: 'family', speaker: 'Mum', text: 'Twice, love. I rang twice. I was not going to ring a third time because then I am the mother who rings three times.' },
            { who: 'family', speaker: 'Mum', text: 'Your dad had his scan. It is fine. It is fine, but I wanted to tell you before you heard it as fine.' },
        ],
        choices: [
            {
                text: '"Tell me all of it. I have got as long as you need."',
                hint: 'Be present',
                deltas: { family_bond: 18, burnout: -6, mara_trust: -3 },
                seeds: { chose_family: true },
                log: 'You gave your mum the whole evening after your dad\'s scan.',
                message: { from: 'Mum', text: 'That was the best hour of my week. Thank you love. x', tone: 'family', thread: 'mum_scan' },
                next: null,
            },
            {
                text: '"Is he alright? Really alright?"',
                hint: 'Get to the fact',
                deltas: { family_bond: 8, burnout: -2 },
                next: null,
            },
            {
                text: '"Can I ring you at the weekend? It is a bad week."',
                hint: 'The sentence you will hear again',
                deltas: { family_bond: -14, burnout: 4 },
                log: 'You put your mum off on the night of your dad\'s scan.',
                message: { from: 'Mum', text: 'Of course. It is only a scan. Speak at the weekend. x', tone: 'family', thread: 'mum_call_back' },
                next: null,
            },
        ],
    },
    ep2_priya_seat: {
        seatAt: 'bar_priya',
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'I kept it. The seat. For fifty minutes, which for me is basically a vigil.' },
            { who: 'friend', speaker: 'Priya', text: 'You look like a photocopy of yourself. Sit down and say something that is not about work.' },
        ],
        choices: [
            {
                text: '"I do not think I can. That is the honest answer."',
                hint: 'Admit it',
                deltas: { friend_closeness: 12, burnout: -8 },
                log: 'You admitted to Priya that you had nothing left outside work.',
                message: { from: 'Priya', text: 'then we sit here and say nothing. that is allowed.', tone: 'friend', thread: 'priya_real' },
                next: null,
            },
            {
                text: '"Nineteen days. Then I am a person again."',
                hint: 'The promise everyone makes',
                deltas: { friend_closeness: 3, burnout: -4 },
                next: null,
            },
        ],
    },
    ep2_crunch_sleep: {
        lines: [
            { who: 'narration', speaker: 'Bed', text: 'You set three alarms. You will use the third one.' },
        ],
        sleep: true,
        next: 'ep2_theo_gone',
    },
    ep2_theo_gone: {
        lines: [
            { who: 'narration', speaker: 'THURSDAY - 8:15 AM', text: 'Your phone goes while you are still finding a shoe.' },
            { who: 'jonah', speaker: 'Jonah', text: 'Theo did not go home. Cleaner found him asleep at his desk at six and he has gone up to the roof and will not come down for me.' },
            { who: 'jonah', speaker: 'Jonah', text: 'He will come down for you. I think that is worse, honestly, but there it is.' },
        ],
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'THURSDAY - 8:15 AM',
        next: null,
        beatOnEnd: 'ep2_break',
    },

    /* ---- The break ---- */

    ep2_theo_break: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'Do not do the voice. Everyone is doing the voice this morning.' },
            { who: 'theo', speaker: 'Theo', text: 'I did the maths at about four. If I sleep six hours I lose seventy-two hours before the slice. Seventy-two. So I stopped sleeping and now I cannot start again.' },
            { who: 'theo', speaker: 'Theo', text: 'And the third act is getting cut anyway. I know. I read the board.' },
        ],
        choices: [
            {
                text: '"I am walking you to a walk-in clinic. Now, today."',
                hint: 'Interrupt it properly',
                deltas: { theo_trust: 22, burnout: 6, mara_trust: -4 },
                seeds: { protected_theo: true, took_theo_to_clinic: true },
                log: 'You took Theo to a clinic on the morning he broke.',
                message: { from: 'Theo', text: 'i slept eleven hours. eleven. thank you for making me go.', tone: 'work', thread: 'theo_clinic' },
                next: 'ep2_break_after',
            },
            {
                text: '"Your work was good. It is being cut for time, not quality."',
                hint: 'Give him the truth he needs',
                deltas: { theo_trust: 14, burnout: 3 },
                seeds: { told_theo_himself: true },
                log: 'You told Theo the truth about his cut work, on the roof.',
                next: 'ep2_break_after',
            },
            {
                text: '"Nineteen days. Then you can fall apart properly."',
                hint: 'Get him back to the desk',
                deltas: { theo_trust: -18, mara_trust: 6, burnout: 5 },
                seeds: { pushed_theo: true },
                log: 'You sent Theo back to his desk anyway.',
                next: 'ep2_break_after',
            },
        ],
    },
    ep2_break_after: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'Okay. Okay.' },
            { who: 'narration', speaker: 'The roof', text: 'The door goes behind you. Mara has come up, holding two coffees she has clearly forgotten about.' },
        ],
        next: null,
    },
    ep2_roof_mara: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'I have been up here four times this month. Never for myself, which I am told is its own symptom.' },
            { who: 'mara', speaker: 'Mara', text: 'I booked you a walk-in appointment. Fairhaven, three o\'clock. I booked it in your name without asking and you can be furious about that if you like.' },
        ],
        choices: [
            {
                text: '"I will go."',
                hint: 'Take the twenty minutes',
                deltas: { mara_trust: 8, burnout: -6 },
                seeds: { booked_clinic: true },
                log: 'You agreed to go to the clinic Mara booked for you.',
                next: 'ep2_to_clinic',
            },
            {
                text: '"Cancel it. Give the slot to Theo."',
                hint: 'Give it away',
                deltas: { theo_trust: 12, mara_trust: 4, burnout: 6 },
                seeds: { gave_slot_away: true },
                log: 'You gave your clinic appointment to Theo.',
                next: 'ep2_gave_slot',
            },
            {
                text: '"After the slice. Nineteen days."',
                hint: 'You know what she will say',
                deltas: { mara_trust: -6, burnout: 10 },
                log: 'You put your own appointment off until after the slice.',
                next: 'ep2_gave_slot',
            },
        ],
    },
    ep2_to_clinic: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Fairhaven Walk-In, three o\'clock. It is two stops on the bus and I have written the address down for you.' },
            { who: 'narration', speaker: 'Travel', text: 'Fairhaven Walk-In is open to you now. Travel there before three.' },
        ],
        next: null,
        beatOnEnd: 'ep2_clinic',
        dayLabelOnEnd: 'THURSDAY - 2:30 PM',
        unlockOnEnd: ['clinic'],
    },
    ep2_gave_slot: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Of course you did.' },
            { who: 'mara', speaker: 'Mara', text: 'Go back inside then. Nineteen days. I will hold the rest of it.' },
        ],
        next: null,
        beatOnEnd: 'ep2_slice',
        sceneOnEnd: 'studio',
        dayLabelOnEnd: 'THURSDAY - 3:10 PM',
    },
    ep2_back_inside: {
        lines: [
            { who: 'narration', speaker: 'The door', text: 'Eleven floors of stairwell, and then the noise of a studio pretending everything is normal.' },
        ],
        next: null,
        beatOnEnd: 'ep2_slice',
        sceneOnEnd: 'studio',
        dayLabelOnEnd: 'THURSDAY - 3:10 PM',
    },

    /* ---- The clinic ---- */

    ep2_clinic_checkin: {
        lines: [
            { who: 'narration', speaker: 'Fairhaven Walk-In', text: 'Lino, a queue-number screen, and a poster about salt from 2019.' },
            { who: 'narration', speaker: 'Reception', text: 'A screen asks for your date of birth. A sign asks you not to abuse the staff. Both feel reasonable.' },
        ],
        next: null,
    },
    ep2_clinic_wait: {
        seatAt: 'clinic_chairs',
        lines: [
            { who: 'narration', speaker: 'Waiting', text: 'Twenty minutes of nothing to do. It is the longest you have sat still in five weeks.' },
            { who: 'player', speaker: 'You', text: 'The countdown is not here. Nobody in this room knows what a vertical slice is.' },
        ],
        onEnter: { deltas: { burnout: -8 } },
        next: null,
    },
    ep2_clinic_poster: {
        lines: [
            { who: 'narration', speaker: 'Posters', text: 'SIGNS OF BURNOUT. Someone has ticked four of the seven in biro. You do not disagree with them.' },
        ],
        next: null,
    },
    ep2_doctor: {
        lines: [
            { who: 'exec', speaker: 'Dr Adeyemi', text: 'Right. Your employer booked this, which is unusual and tells me something on its own.' },
            { who: 'exec', speaker: 'Dr Adeyemi', text: 'I am going to ask you three things and I would like the real answers, because I have eight minutes and you have driven here on empty.' },
            { who: 'exec', speaker: 'Dr Adeyemi', text: 'Sleep. Food. And when did you last do something that was not for somebody else?' },
        ],
        choices: [
            {
                text: 'Tell her all of it, honestly.',
                hint: 'The whole picture',
                deltas: { burnout: -22 },
                seeds: { was_honest_doctor: true },
                log: 'You told a doctor the truth about how you were living.',
                message: { from: 'Mara', text: 'You went. Thank you. That is the only management I am doing today.', tone: 'work', thread: 'mara_clinic' },
                next: 'ep2_doctor_after',
            },
            {
                text: '"It is a busy period. It ends in nineteen days."',
                hint: 'The version you have been using',
                deltas: { burnout: -6 },
                next: 'ep2_doctor_after',
            },
        ],
    },
    ep2_doctor_after: {
        lines: [
            { who: 'exec', speaker: 'Dr Adeyemi', text: 'Nineteen days is a project deadline. Your body does not have a project.' },
            { who: 'exec', speaker: 'Dr Adeyemi', text: 'I am signing you off for two days. You may of course ignore me. People usually do, and then I see them in March.' },
            { who: 'narration', speaker: 'THREE WEEKS LATER', text: 'The nineteen days go the way they always go: too fast to feel, too slow to sleep through.' },
        ],
        next: null,
        beatOnEnd: 'ep2_slice',
        sceneOnEnd: 'studio',
        dayLabelOnEnd: 'WEDNESDAY - 9:30 AM',
    },

    /* ---- The slice ---- */

    ep2_slice_arrive: {
        lines: [
            { who: 'narration', speaker: 'Vantage Publishing', text: 'The same lobby, the same loop of games that shipped on time. You know where the lifts are now.' },
            { who: 'mara', speaker: 'Mara', text: 'Whatever happens in there, the thing on that drive is better than what we showed him. That is already true and he cannot un-true it.' },
        ],
        next: null,
    },
    ep2_slice_screen: {
        lines: [
            { who: 'narration', speaker: 'Presentation wall', text: 'Your slice, four metres wide. Twenty minutes of it. The third act is not in it, and the twenty minutes that are in it hold together.' },
        ],
        next: null,
    },
    ep2_slice_review: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'Twenty-two minutes. I asked for a slice and you brought me a game. A short one, but a game.' },
            { who: 'exec', speaker: 'Halvard', text: 'So. Full production, and I want a date I can put in a deck. What do you tell me?' },
        ],
        choices: [
            {
                text: '"Give us the date we can hold, not the one you want."',
                hint: 'Protect the next nine months',
                deltas: { mara_trust: 14, jonah_closeness: 12, theo_trust: 8, burnout: -4 },
                seeds: { held_the_line: true },
                log: 'You refused to promise a date the team could not hold.',
                next: 'ep2_slice_after',
            },
            {
                text: '"Whatever date you need. We will make it work."',
                hint: 'What he wants to hear',
                deltas: { mara_trust: 8, burnout: 14, jonah_closeness: -12, theo_trust: -8 },
                seeds: { crunched_team: true },
                log: 'You promised the publisher a date the team would have to bleed for.',
                next: 'ep2_slice_after',
            },
            {
                text: '"Ask the people who built it. They are in the room."',
                hint: 'Hand him the team',
                deltas: { mara_trust: 6, jonah_closeness: 16, theo_trust: 14 },
                seeds: { spoke_for_team: true },
                log: 'You made the publisher ask the team directly.',
                message: { from: 'Theo', text: 'you made halvard ask ME. i will remember that for years.', tone: 'work', thread: 'theo_thanks' },
                next: 'ep2_slice_after',
            },
        ],
    },
    ep2_slice_after: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'Hm. Fine. Send me the plan by Friday and I will defend it upstairs, which I do not do often.' },
            { who: 'mara', speaker: 'Mara', text: 'That is the second-best thing that has ever happened in that room. Go home. I mean it this time and I will be checking.' },
            { who: 'narration', speaker: 'FRIDAY - 6:20 PM', text: 'The studio empties before seven for the first time since you arrived. Somebody rubs the countdown off the whiteboard.' },
        ],
        next: 'ep2_close',
    },
    ep2_close: {
        lines: [
            { who: 'player', speaker: 'You', text: 'Nine months of production ahead. A dad with a scan result. A seat Priya keeps holding.' },
            { who: 'narration', speaker: 'END OF EPISODE 2', text: 'You know all these rooms now. The question is which ones you actually go to.' },
        ],
        next: null,
        beatOnEnd: 'ep2_epilogue',
        unlockOnEnd: ['studio', 'home', 'bar', 'family', 'publisher', 'rooftop', 'clinic'],
    },

    epilogue: {
        lines: [
            { who: 'narration', speaker: 'SUNDAY - 3:40 PM', text: 'Plates cleared. The dog asleep. Somebody has put the football on with the sound off.' },
            { who: 'player', speaker: 'You', text: 'Two weeks ago I did not know any of these rooms. Now I have to keep choosing between them.' },
            { who: 'narration', speaker: 'END OF EPISODE 1', text: 'Six weeks to the slice. Every place you have been is still standing, and still waiting.' },
        ],
        next: null,
        beatOnEnd: 'epilogue',
        unlockOnEnd: ['studio', 'home', 'bar', 'family', 'publisher'],
    },

    /* ==================== EPISODE 4: "THE EMBEDDED PRODUCER" ==================== */

    ep4_open: {
        lines: [
            { who: 'narration', speaker: 'Sleep', text: 'You wake up at 6:15 AM before the alarm. Your inbox already has calendar invites from Vantage.' },
        ],
        sleep: true,
        next: 'ep4_monday_open',
    },
    ep4_monday_open: {
        lines: [
            { who: 'narration', speaker: 'EPISODE 4 — THE EMBEDDED PRODUCER', text: 'Monday morning. Vantage Publishing oversight begins today.' },
            { who: 'narration', speaker: 'MONDAY - 8:30 AM', text: 'Sitting at the desk across from Jonah is someone with Priya\'s cheekbones and a razor-sharp charcoal blazer.' },
            { who: 'player', speaker: 'You', text: 'Tara Patel. Senior Principal Producer, Vantage Portfolio Group.' },
        ],
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'MONDAY - 8:30 AM',
        next: null,
        beatOnEnd: 'ep4_monday',
        unlockOnEnd: ['studio', 'rooftop', 'home', 'bar', 'family', 'hospital'],
    },
    ep4_tara_intro: {
        seatAt: 'tara',
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'Good morning. You are the second act lead. I have read the velocity charts. You are bleeding twelve story points a sprint.' },
            { who: 'tara', speaker: 'Tara Patel', text: 'Priya mentioned you. She said you were thoughtful. In my experience, thoughtful is the polite word publishers use before a six-month delay.' },
        ],
        choices: [
            {
                text: '"Thoughtful is why the build runs without crashing."',
                hint: 'Stand your ground with professional pride',
                deltas: { mara_trust: 6, nadia_trust: 8, burnout: 4 },
                seeds: { stood_up_to_tara: true },
                log: 'You told Tara that quality took priority over her velocity metrics.',
                next: 'ep4_tara_intro_after',
            },
            {
                text: '"Show me the bottlenecks you identified. I want this to ship too."',
                hint: 'Pragmatic partnership',
                deltas: { mara_trust: 4, burnout: 2 },
                seeds: { allied_with_tara: true },
                log: 'You offered to work directly with Tara on process efficiency.',
                next: 'ep4_tara_intro_after',
            },
            {
                text: '"Priya should not have brought personal relationships into this."',
                hint: 'Strict boundary',
                deltas: { friend_closeness: -6, burnout: 4 },
                next: 'ep4_tara_intro_after',
            },
        ],
    },
    ep4_tara_intro_after: {
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'We will see. I need individual task estimates on my desk by two. Starting with your junior report.' },
        ],
        next: null,
        beatOnEnd: 'ep4_producer',
    },
    ep4_nadia_state: {
        lines: [
            { who: 'nadia', speaker: 'Nadia', text: 'She watched me type for twenty minutes. Literally stood behind my chair. My hands were shaking so bad I inverted the camera controls.' },
            { who: 'nadia', speaker: 'Nadia', text: 'Is she going to get me fired? Please be honest.' },
        ],
        choices: [
            {
                text: '"Nobody is firing you. Route all her requests through me."',
                hint: 'Shield her completely',
                deltas: { nadia_trust: 16, burnout: 8 },
                seeds: { sheltered_nadia_from_audit: true },
                log: 'You promised to shield Nadia from Tara\'s audit.',
                next: null,
            },
            {
                text: '"She is looking for predictability, Nadia. Just log your hours accurately."',
                hint: 'Coach her to survive it',
                deltas: { nadia_trust: 6, burnout: -2 },
                next: null,
            },
        ],
    },
    ep4_jonah_state: {
        lines: [
            { who: 'jonah', speaker: 'Jonah', text: 'She moved my desk plant. Said foliage was not ergonomic. I have seven weeks left on this contract and I am counting every second.' },
        ],
        next: null,
    },
    ep4_desk: {
        lines: [
            { who: 'narration', speaker: 'Your desk', text: 'A new spreadsheet is open on your screen: VANTAGE_EFFICIENCY_AUDIT_Q3.xlsx. Half the cells are highlighted red.' },
        ],
        next: null,
    },
    ep4_audit_review: {
        seatAt: 'pub_table',
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'Look at this burndown. If we cut Nadia\'s three puzzle rooms, we make the November release window with four weeks of buffer.' },
            { who: 'tara', speaker: 'Tara Patel', text: 'She will be disappointed, but she is twenty-three. She will survive. If we miss November, Vantage freezes Northlight\'s headcount across the board.' },
        ],
        choices: [
            {
                text: '"Her puzzle rooms are the emotional heart of Act 2. I refuse to cut them."',
                hint: 'Protect the creative core and your report',
                deltas: { nadia_trust: 18, mara_trust: 8, burnout: 10 },
                seeds: { stood_up_to_tara: true, held_the_line: true },
                log: 'You refused Tara\'s demand to gut Nadia\'s puzzle levels.',
                next: 'ep4_audit_after',
            },
            {
                text: '"Cut one room as a compromise. We polish the remaining two to perfection."',
                hint: 'Middle path diplomacy',
                deltas: { nadia_trust: 4, burnout: 4 },
                seeds: { middle_path: true },
                next: 'ep4_audit_after',
            },
            {
                text: '"If Vantage freezes headcount, we all lose. Make the cuts."',
                hint: 'Corporate survival',
                deltas: { nadia_trust: -22, mara_trust: -6, burnout: 6 },
                log: 'You approved the gutting of Nadia\'s design work to please Vantage.',
                next: 'ep4_audit_after',
            },
        ],
    },
    ep4_audit_after: {
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'Decision logged. Now get some air. Priya has been texting me every forty minutes to make sure I have not murdered you.' },
        ],
        next: null,
    },
    ep4_mara_pressure: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Tara is not a villain. She is an auditor sent by people who only care about quarterly EBITDA. Do not make it personal or she will win on process.' },
        ],
        next: null,
    },
    ep4_theo_audit: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'She asked why lighting took three iterations. I told her light does not read spreadsheets. Jonah actually laughed out loud.' },
        ],
        next: null,
    },
    ep4_priya_warning: {
        lines: [
            { who: 'friend', speaker: 'Priya (phone)', text: 'Meet me at the Lamplighter tonight. Tara agreed to come after eight. You two need to be in a room with alcohol before someone files an HR ticket.' },
        ],
        next: null,
        beatOnEnd: 'ep4_standoff',
        unlockOnEnd: ['bar'],
    },
    ep4_sisters_meeting: {
        seatAt: 'bar_priya',
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'Rule number one: no laptops on the table. Rule number two: you two are going to clink glasses like civilised adults.' },
            { who: 'tara', speaker: 'Tara Patel', text: 'Diet tonic, thanks. And I am on call until ten, Priya.' },
            { who: 'player', speaker: 'You', text: 'The tension in the booth could slice glass. Priya kicks you gently under the table.' },
        ],
        choices: [
            {
                text: '"Tara, why did you leave development to become an auditor?"',
                hint: 'Ask about the person behind the suit',
                deltas: { friend_closeness: 10, burnout: -6 },
                seeds: { allied_with_tara: true },
                log: 'You asked Tara about her past in development, softening her corporate armor.',
                next: 'ep4_sisters_talk',
            },
            {
                text: '"Priya tells me you were a ferocious guitarist before business school."',
                hint: 'Break the ice with family history',
                deltas: { friend_closeness: 8, burnout: -4 },
                next: 'ep4_sisters_talk',
            },
        ],
    },
    ep4_sisters_talk: {
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'I made a game once. Shipped three years late, destroyed my marriage, and sold nine hundred copies. That is why I do this.' },
            { who: 'tara', speaker: 'Tara Patel', text: 'Deadlines are not evil. Failing in secret is evil. Remember that on Monday.' },
            { who: 'player', speaker: 'You', text: 'For the first time all week, the corporate mask slips just enough to see the exhaustion underneath.' },
        ],
        next: 'ep4_close',
    },
    ep4_close: {
        lines: [
            { who: 'narration', speaker: 'FRIDAY - 11:15 PM', text: 'The Lamplighter closes. Tara takes a black cab into the financial district. Priya hugs you on the pavement.' },
            { who: 'friend', speaker: 'Priya', text: 'Thank you for not hating her. She is impossible, but she is still my sister.' },
            { who: 'narration', speaker: 'END OF EPISODE 4', text: 'The schedule is tighter than ever. Full production enters its fifth month.' },
        ],
        next: null,
        beatOnEnd: 'ep4_epilogue',
        unlockOnEnd: ['studio', 'home', 'bar', 'family', 'publisher', 'rooftop', 'clinic', 'hospital'],
    },

    /* ==================== EPISODE 5: "THE BLACKOUT" ==================== */

    ep5_open: {
        lines: [
            { who: 'narration', speaker: 'Sleep', text: 'You wake up at 2:14 AM. Your phone screen is glowing on the bedside table with sixteen urgent Discord pings.' },
        ],
        sleep: true,
        next: 'ep5_monday_open',
    },
    ep5_monday_open: {
        lines: [
            { who: 'narration', speaker: 'EPISODE 5 — THE BLACKOUT', text: 'Six weeks before gold submission. The Northlight server room has had a primary drive failure.' },
            { who: 'narration', speaker: 'TUESDAY - 2:38 AM', text: 'Fluorescent lights buzzing in the dark. Theo is under a desk pulling cables. Nadia is staring at a command line.' },
            { who: 'player', speaker: 'You', text: 'Three branches failed to reconcile. The merge conflict covers eighty thousand lines of asset metadata.' },
        ],
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'TUESDAY - 2:38 AM',
        next: null,
        beatOnEnd: 'ep5_blackout',
        unlockOnEnd: ['studio', 'rooftop', 'home', 'bar', 'family', 'hospital'],
    },
    ep5_server_crisis: {
        seatAt: 'laptop',
        lines: [
            { who: 'player', speaker: 'You', text: 'The RAID controller overheated at midnight. The last clean cloud backup was taken eleven days ago.' },
            { who: 'narration', speaker: 'Git Conflict', text: 'FATAL: HEAD detached at commit 4f9e1. Act 2 and Act 3 level geometry corrupted in main.' },
        ],
        choices: [
            {
                text: 'Stay at the terminal and reconstruct the asset manifest by hand.',
                hint: 'Absorb the brutal labor yourself',
                deltas: { burnout: 20, mara_trust: 10, nadia_trust: 12 },
                seeds: { pulled_all_nighter_solo: true },
                log: 'You stayed up all night manually resolving corrupted repository branches.',
                next: 'ep5_server_after',
            },
            {
                text: 'Roll back to the eleven-day-old backup and inform Mara immediately.',
                hint: 'Clean, honest, costs two weeks of work',
                deltas: { mara_trust: 4, theo_trust: -8, burnout: 6 },
                log: 'You made the painful call to roll back the corrupted build.',
                next: 'ep5_server_after',
            },
        ],
    },
    ep5_server_after: {
        lines: [
            { who: 'narration', speaker: '3:45 AM', text: 'The coffee machine is dry. Outside, rain lashes against the glass of the fourth floor.' },
        ],
        next: null,
    },
    ep5_nadia_tears: {
        lines: [
            { who: 'nadia', speaker: 'Nadia', text: 'My lighting pass... thirty hours of baked lightmaps. They are completely scrambled. The shadows look like static noise.' },
            { who: 'nadia', speaker: 'Nadia', text: 'I did not back up the raw files locally because the shared drive was full. This is my fault. It is my fault.' },
        ],
        choices: [
            {
                text: '"It is server hardware failure, Nadia. Not yours. Breathe."',
                hint: 'Reassure and protect',
                deltas: { nadia_trust: 16, burnout: -4 },
                log: 'You comforted Nadia during the middle-of-the-night server crash.',
                next: null,
            },
            {
                text: '"We rebuild it tomorrow. Go home and sleep now."',
                hint: 'Order her to rest',
                deltas: { nadia_trust: 10, burnout: 4 },
                next: null,
            },
        ],
    },
    ep5_theo_rescue: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'I saved six gigabytes of cache on an external SSD before the drives unmounted. It is not everything, but it is enough to save the protagonist model.' },
            { who: 'theo', speaker: 'Theo', text: 'Two years ago I would have panicked. Tonight I just grabbed the cord.' },
        ],
        choices: [
            {
                text: '"You saved the project tonight, Theo."',
                hint: 'Give him full credit',
                deltas: { theo_trust: 16, burnout: -4 },
                log: 'You recognized Theo for saving crucial game data during the crash.',
                next: null,
            },
        ],
    },
    ep5_mara_emergency: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Halvard is taking the 7:15 train from the capital. He does not know about the drive failure yet.' },
            { who: 'mara', speaker: 'Mara', text: 'There is an internal email thread from February on the old server. Halvard asked to cut backup redundancy to shave eighteen thousand pounds from our cloud bill.' },
            { who: 'mara', speaker: 'Mara', text: 'I signed off on it so we could keep Nadia\'s junior salary. If Halvard sees that thread, he will blame us for negligence.' },
        ],
        choices: [
            {
                text: '"Keep the emails. When Halvard screams, show him his own signature."',
                hint: 'Accountability with teeth',
                deltas: { mara_trust: 10, burnout: 8 },
                seeds: { whistleblower_emailed: true },
                log: 'You preserved the paper trail proving the publisher cut server backup redundancy.',
                next: 'ep5_to_investigate',
            },
            {
                text: '"Archive the thread somewhere safe off-site. We need leverage."',
                hint: 'Pragmatic defense',
                deltas: { mara_trust: 6, burnout: 4 },
                seeds: { discovered_vantage_leak: true },
                log: 'You archived the internal redundancy dispute off-site.',
                next: 'ep5_to_investigate',
            },
            {
                text: '"Delete it. If this turns into a legal fight, Northlight is done."',
                hint: 'Bury it to survive',
                deltas: { mara_trust: -8, burnout: 10 },
                seeds: { erased_crunch_records: true },
                log: 'You agreed to delete the email paper trail to avoid publisher fallout.',
                next: 'ep5_to_investigate',
            },
        ],
    },
    ep5_to_investigate: {
        lines: [
            { who: 'narration', speaker: '5:30 AM', text: 'Dawn breaks grey and wet over the railway arches. Go home to shower and check on family before Halvard arrives.' },
        ],
        next: null,
        beatOnEnd: 'ep5_leak',
        sceneOnEnd: 'home',
        dayLabelOnEnd: 'TUESDAY - 6:15 AM',
        unlockOnEnd: ['home'],
    },
    ep5_home_investigate: {
        seatAt: 'home_desk',
        lines: [
            { who: 'narration', speaker: 'Work Laptop', text: 'You open the remote logs. The paper trail is unambiguous: Vantage deliberately stripped disaster recovery to hit an artificial margin.' },
        ],
        choices: [
            {
                text: 'Send a blind copy of the audit to an industry whistleblower reporter.',
                hint: 'Hidden Alternate Timeline: The Public Expose',
                deltas: { mara_trust: -10, burnout: 6 },
                seeds: { whistleblower_emailed: true, unlocked_indie_timeline: true },
                log: 'You secretly leaked the Vantage crunch and negligence documents to a games journalist.',
                next: null,
            },
            {
                text: 'Save it to an encrypted local thumb drive for your own protection.',
                hint: 'Keep your shield ready',
                deltas: { burnout: -2 },
                seeds: { discovered_vantage_leak: true },
                next: null,
            },
        ],
    },
    ep5_iris_dad_update: {
        lines: [
            { who: 'sister', speaker: 'Iris', text: 'Hey. Dad is back home in his armchair. He is doing the crossword and complaining about the porridge.' },
            { who: 'sister', speaker: 'Iris', text: 'He told me to tell you he saw an advert for your game in a magazine at the clinic. He cut it out and put it on the fridge.' },
        ],
        choices: [
            {
                text: '"Tell him I am going to make him proud. No matter what happens with Vantage."',
                hint: 'Anchor yourself in family',
                deltas: { family_bond: 16, burnout: -8 },
                seeds: { dad_recovered_proud: true },
                log: 'You told Iris you were going to make your dad proud of the work.',
                next: 'ep5_to_reckoning',
            },
            {
                text: '"I am exhausted, Iris. Everything at work is hanging by a wire."',
                hint: 'Vulnerable honesty',
                deltas: { family_bond: 10, burnout: -4 },
                seeds: { admitted_defeat_to_iris: true },
                next: 'ep5_to_reckoning',
            },
        ],
    },
    ep5_to_reckoning: {
        lines: [
            { who: 'narration', speaker: 'TUESDAY - 9:00 AM', text: 'Vantage Publishing HQ. Halvard car is parked outside Northlight. Time to face the room.' },
        ],
        next: null,
        beatOnEnd: 'ep5_reckoning',
        sceneOnEnd: 'studio',
        dayLabelOnEnd: 'TUESDAY - 9:15 AM',
        unlockOnEnd: ['publisher', 'studio'],
    },
    ep5_halvard_reckoning: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'A drive crash. Six weeks out. I have three commercial broadcast buys locked for November.' },
            { who: 'exec', speaker: 'Halvard', text: 'I do not care who stayed up until four. I care if the milestone candidate is ready for console certification.' },
        ],
        choices: [
            {
                text: '"We held the line. We recovered the data and Act 2 is standing."',
                hint: 'Deliver the truth with conviction',
                deltas: { mara_trust: 12, nadia_trust: 10, burnout: 4 },
                seeds: { held_the_line: true },
                log: 'You faced Halvard and proved Northlight survived the crash without compromising the team.',
                next: 'ep5_halvard_after',
            },
            {
                text: '"You cut our server redundancy in February, Halvard. You caused this."',
                hint: 'Confront him directly with the facts',
                deltas: { mara_trust: 8, theo_trust: 12, jonah_closeness: 14, burnout: 8 },
                seeds: { stood_up_to_tara: true, held_the_line: true },
                log: 'You called Halvard out to his face for cutting server backups.',
                next: 'ep5_halvard_after',
            },
        ],
    },
    ep5_halvard_after: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: '...Submit the build for Gold Master by Friday. If it fails cert, we invoke the penalty clause.' },
            { who: 'mara', speaker: 'Mara', text: 'Friday. Five days. That gives us one shot at certification.' },
        ],
        next: null,
    },
    ep5_mara_defense: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'You held him off. I do not know how you still have a pulse, but you did it.' },
        ],
        next: null,
    },
    ep5_tara_confession: {
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'For the record: I verified your commit logs before Halvard walked in. You pulled off something extraordinary last night. Do not let him make you feel small.' },
        ],
        next: null,
    },
    ep5_close: {
        lines: [
            { who: 'narration', speaker: 'FRIDAY - 7:00 PM', text: 'The crash is behind you. The Gold Master build is being packaged for certification.' },
            { who: 'player', speaker: 'You', text: 'One week left. The milestone that defines whether two years of our lives were worth it.' },
            { who: 'narration', speaker: 'END OF EPISODE 5', text: 'Episode 6: The Gold Master.' },
        ],
        next: null,
        beatOnEnd: 'ep5_epilogue',
        unlockOnEnd: ['studio', 'home', 'bar', 'family', 'publisher', 'rooftop', 'clinic', 'hospital'],
    },

    /* ==================== EPISODE 6: "THE GOLD MASTER" ==================== */

    ep6_open: {
        lines: [
            { who: 'narration', speaker: 'Sleep', text: 'You wake up at 5:45 AM. Today is the final submission to console certification.' },
        ],
        sleep: true,
        next: 'ep6_monday_open',
    },
    ep6_monday_open: {
        lines: [
            { who: 'narration', speaker: 'EPISODE 6 — THE GOLD MASTER', text: 'Day of submission. Two years of eighty-hour sprints come down to a single digital checksum.' },
            { who: 'narration', speaker: 'MONDAY - 8:15 AM', text: 'The studio is dead quiet. No music, no banter. Just forty people watching the build compiler output.' },
            { who: 'player', speaker: 'You', text: 'Release Candidate 4. If this passes, the game is pressed to discs and uploaded to stores.' },
        ],
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'MONDAY - 8:15 AM',
        next: null,
        beatOnEnd: 'ep6_gold',
        unlockOnEnd: ['studio', 'rooftop', 'home', 'bar', 'family', 'hospital'],
    },
    ep6_rc_check: {
        seatAt: 'laptop',
        lines: [
            { who: 'player', speaker: 'You', text: 'Automated test suite complete: 1,480 tests passed. Two warnings.' },
            { who: 'narration', speaker: 'QA Report', text: 'Platform certification checklist: 99.2% compliance. Memory threshold green.' },
        ],
        next: null,
    },
    ep6_nadia_polish: {
        lines: [
            { who: 'nadia', speaker: 'Nadia', text: 'Look at the final cutscene transition. It does not hitch anymore. It transitions seamlessly into the credits.' },
            { who: 'nadia', speaker: 'Nadia', text: 'I did not think we were going to make it here. Thank you for keeping me on this.' },
        ],
        choices: [
            {
                text: '"You made this game what it is, Nadia."',
                hint: 'Celebrate her accomplishment',
                deltas: { nadia_trust: 16, burnout: -4 },
                log: 'You gave Nadia full credit for bringing the game across the finish line.',
                next: null,
            },
        ],
    },
    ep6_theo_fatal_bug: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'Stop the upload. STOP THE UPLOAD.' },
            { who: 'theo', speaker: 'Theo', text: 'Console QA ran the stress endurance rig on devkits. At three hours forty minutes, there is a memory leak in the sound engine. The hardware hard-crashes to dashboard.' },
            { who: 'theo', speaker: 'Theo', text: 'If we submit this, it will fail cert. Or worse... if cert misses it, three million players crash on day one.' },
        ],
        choices: [
            {
                text: '"Take it to Mara right now. We cannot ship a crash bug."',
                hint: 'Honesty before launch',
                deltas: { theo_trust: 12, burnout: 8 },
                seeds: { pushed_launch_back: true },
                log: 'You halted the upload to address the memory leak.',
                next: 'ep6_to_cert',
            },
            {
                text: '"We patch it on day zero. We cannot miss the retail disc pressing."',
                hint: 'The modern industry gamble',
                deltas: { theo_trust: -12, mara_trust: 8, burnout: 6 },
                seeds: { certified_flawed_build: true },
                log: 'You chose to gamble on a day-zero patch rather than delay submission.',
                next: 'ep6_to_cert',
            },
        ],
    },
    ep6_to_cert: {
        lines: [
            { who: 'narration', speaker: 'CONFERENCE ROOM - 11:30 AM', text: 'The submission signing. Mara, Tara, and the platform release waiver.' },
        ],
        next: null,
        beatOnEnd: 'ep6_cert',
    },
    ep6_sign_decision: {
        seatAt: 'pub_table',
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'If we delay for two weeks, Halvard pulls the retail physical launch. We lose eight hundred thousand pre-orders.' },
            { who: 'tara', speaker: 'Tara Patel', text: 'Every major release ships with day-one patches now. Submit the Gold Master. We will hotfix the audio leak before street date.' },
            { who: 'player', speaker: 'You', text: 'The pen is sitting on the signature line. Everyone is looking at you.' },
        ],
        choices: [
            {
                text: '"Sign the waiver. Protect the release date, and we patch it before street date."',
                hint: 'The corporate industry reality',
                deltas: { mara_trust: 12, nadia_trust: -6, burnout: 12 },
                seeds: { certified_flawed_build: true },
                log: 'You signed off on the Gold Master submission with a day-one patch commitment.',
                next: 'ep6_sign_after',
            },
            {
                text: '"Refuse to sign. Delay the launch two weeks. Ship a game that actually works."',
                hint: 'The moral stance that costs money',
                deltas: { mara_trust: -8, theo_trust: 18, nadia_trust: 18, burnout: -4 },
                seeds: { pushed_launch_back: true, held_the_line: true },
                log: 'You refused to certify a broken build, forcing a two-week delay for quality.',
                next: 'ep6_sign_after',
            },
        ],
    },
    ep6_sign_after: {
        lines: [
            { who: 'narration', speaker: 'The Checksum', text: 'GOLD MASTER ARTIFACT #92401 SUBMITTED TO PLATFORM SERVICES.' },
            { who: 'player', speaker: 'You', text: 'It is done. Two years of sweat and panic, compressed into an optical image.' },
        ],
        next: null,
    },
    ep6_tara_waiver: {
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'Paperwork filed. You held your nerve under fire. Most leads would have crumbled.' },
        ],
        next: null,
    },
    ep6_dad_launch_call: {
        lines: [
            { who: 'family', speaker: 'Dad', text: 'Your sister brought the newspaper over. Full page advert with your title art. I told the pharmacist you built it.' },
            { who: 'family', speaker: 'Dad', text: 'I know you have not slept much this year. But whatever happens on launch day, son... your name is on something real.' },
        ],
        choices: [
            {
                text: '"Thank you, Dad. That means more than any review score."',
                hint: 'Cherish the moment with him',
                deltas: { family_bond: 20, burnout: -12 },
                seeds: { family_attended_launch: true },
                log: 'You shared a quiet moment with your dad before launch.',
                next: 'ep6_to_party',
            },
        ],
    },
    ep6_to_party: {
        lines: [
            { who: 'narration', speaker: 'THREE WEEKS LATER', text: 'Launch day arrives. Street date is today. The Lamplighter is packed with the Northlight crew.' },
        ],
        next: null,
        beatOnEnd: 'ep6_launch_night',
        sceneOnEnd: 'bar',
        dayLabelOnEnd: 'THURSDAY - 9:30 PM',
        unlockOnEnd: ['bar', 'rooftop'],
    },
    ep6_launch_celebration: {
        seatAt: 'bar_priya',
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'TO SHIFT! TO NORTHLIGHT! And to the fact that you survived eighteen months of corporate nonsense!' },
            { who: 'player', speaker: 'You', text: 'Pints clinking, cider spilling, Theo laughing with a glass of champagne. It feels like the first breath of clean oxygen in two years.' },
        ],
        next: 'ep6_reviews_arrive',
    },
    ep6_reviews_arrive: {
        seatAt: 'roof_edge',
        lines: [
            { who: 'narration', speaker: 'MIDNIGHT', text: 'Midnight strikes. Phones across the booth begin vibrating simultaneously.' },
            { who: 'narration', speaker: 'Metacritic Verdict', text: 'ATLAS: 88/100 — "A poignant, impeccably crafted human triumph." Critical consensus: Universal acclaim.' },
            { who: 'nadia', speaker: 'Nadia', text: 'Eighty-eight... eighty-eight! They mentioned the puzzle rooms! They said they were masterclasses in environmental pacing!' },
            { who: 'player', speaker: 'You', text: 'The reviews are glowing. But on the rooftop edge, looking out at the city, you know the human tally has already been written.' },
        ],
        next: 'ep6_close',
    },
    ep6_close: {
        lines: [
            { who: 'narration', speaker: 'FRIDAY - 2:30 AM', text: 'The launch party winds down. The world has your game now. It belongs to strangers.' },
            { who: 'player', speaker: 'You', text: 'Ahead lies the final horizon: What kind of life do I want to build out of this?' },
            { who: 'narration', speaker: 'END OF EPISODE 6', text: 'Episode 7: The Horizon (Series Finale).' },
        ],
        next: null,
        beatOnEnd: 'ep6_epilogue',
        unlockOnEnd: ['studio', 'home', 'bar', 'family', 'publisher', 'rooftop', 'clinic', 'hospital'],
    },

    /* ==================== EPISODE 7: "THE HORIZON" (FINALE) ==================== */

    ep7_open: {
        lines: [
            { who: 'narration', speaker: 'Sleep', text: 'You sleep eight uninterrupted hours for the first time in two years.' },
        ],
        sleep: true,
        next: 'ep7_monday_open',
    },
    ep7_monday_open: {
        lines: [
            { who: 'narration', speaker: 'EPISODE 7 — THE HORIZON', text: 'Two months post-launch. The game has sold 1.8 million copies.' },
            { who: 'narration', speaker: 'MONDAY - 10:00 AM', text: 'Northlight smells of spring rain and quiet accomplishment. Industry awards letters sit beside the reception coffee machine.' },
            { who: 'player', speaker: 'You', text: 'The storm has passed. Today is about what kind of life we build in the clearing.' },
        ],
        sceneOnEnter: 'studio',
        dayLabelOnEnter: 'MONDAY - 10:00 AM',
        next: null,
        beatOnEnd: 'ep7_aftermath',
        unlockOnEnd: ['studio', 'rooftop', 'home', 'bar', 'family', 'hospital', 'publisher'],
    },
    ep7_mara_talk: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Halvard is waiting at Vantage HQ. He has prepared the five-year renewal package.' },
            { who: 'mara', speaker: 'Mara', text: 'He wants to offer you the Studio Director title. My title. He thinks I am too tired to fight for it, and honestly... he might be right.' },
        ],
        choices: [
            {
                text: '"I do not want your job, Mara. I want us to run this studio right."',
                hint: 'Stand by your director',
                deltas: { mara_trust: 16, burnout: -4 },
                next: 'ep7_mara_after',
            },
            {
                text: '"I will hear what he has to say before I make any promises."',
                hint: 'Keep your options open',
                deltas: { mara_trust: 4 },
                next: 'ep7_mara_after',
            },
        ],
    },
    ep7_mara_after: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'Whatever you decide up there: do not let them convince you that human beings are disposable lines on an expense sheet.' },
        ],
        next: null,
    },
    ep7_nadia_awards: {
        lines: [
            { who: 'nadia', speaker: 'Nadia', text: 'Look! The Game Developers Choice Awards nominated our puzzle design! My name is on the ballot!' },
            { who: 'nadia', speaker: 'Nadia', text: 'You took all the hits so I could build those rooms. I will never forget that.' },
        ],
        choices: [
            {
                text: '"You earned every single vote, Nadia. Be proud."',
                hint: 'A mentor\'s true reward',
                deltas: { nadia_trust: 20, burnout: -6 },
                seeds: { jonah_mentored_nadia: true },
                log: 'You celebrated Nadia\'s prestigious design nomination.',
                next: null,
            },
        ],
    },
    ep7_theo_future: {
        lines: [
            { who: 'theo', speaker: 'Theo', text: 'I am taking three weeks of holiday. Real holiday. Going to the coast with zero screens.' },
            { who: 'theo', speaker: 'Theo', text: 'When I come back... I want to pitch a smaller game. Something human. With you, if you are still here.' },
        ],
        next: null,
    },
    ep7_jonah_visit: {
        lines: [
            { who: 'jonah', speaker: 'Jonah', text: 'Dropped by with cinnamon rolls. Look at this place — sunlight on the desks. Almost looks like a normal job.' },
            { who: 'jonah', speaker: 'Jonah', text: 'If you ever get tired of Vantage, that studio charter we signed on the roof still has my name on it.' },
        ],
        choices: [
            {
                text: '"Keep that charter ready, Jonah."',
                hint: 'Plant the seed for an indie future',
                deltas: { jonah_closeness: 16 },
                seeds: { unlocked_coop_timeline: true },
                next: 'ep7_to_reckoning',
            },
            {
                text: '"Enjoy the nursery pickups, Jonah. You earned your peace."',
                hint: 'Wish him well',
                deltas: { jonah_closeness: 8 },
                next: 'ep7_to_reckoning',
            },
        ],
    },
    ep7_to_reckoning: {
        lines: [
            { who: 'narration', speaker: 'VANTAGE HQ - 11:30 AM', text: 'The glass tower overlooking the river. Halvard\'s top-floor executive suite.' },
        ],
        next: null,
        beatOnEnd: 'ep7_reckoning',
        sceneOnEnd: 'publisher',
        dayLabelOnEnd: 'MONDAY - 11:30 AM',
        unlockOnEnd: ['publisher'],
    },
    ep7_halvard_offer: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'One point eight million copies. The board is ecstatic. You proved you can manage chaos and hit a number.' },
            { who: 'exec', speaker: 'Halvard', text: 'Here is the contract: Studio Director of Northlight Interactive. Full executive bonus package. Stock vesting over four years.' },
            { who: 'exec', speaker: 'Halvard', text: 'One condition: We spin up Atlas 2 with a lean core. You lay off 40% of the studio, including the junior art and narrative staff. Rehire contractors when needed.' },
        ],
        choices: [
            {
                text: '"Never. I would rather walk out the front door than gut the people who built this."',
                hint: 'The righteous refusal',
                deltas: { mara_trust: 20, nadia_trust: 20, theo_trust: 20, jonah_closeness: 20 },
                seeds: { walked_away_clean: true, held_the_line: true },
                log: 'You rejected Halvard\'s corporate director offer and refused to fire your team.',
                next: 'ep7_halvard_aftermath',
            },
            {
                text: '"I accept. The industry is harsh, and I will be the one holding the steering wheel."',
                hint: 'The pragmatic corporate succession',
                deltas: { mara_trust: -20, nadia_trust: -30, burnout: 15 },
                seeds: { stayed_vantage_director: true },
                log: 'You accepted the Studio Director position at Vantage, choosing corporate power.',
                next: 'ep7_halvard_aftermath',
            },
        ],
    },
    ep7_halvard_aftermath: {
        lines: [
            { who: 'exec', speaker: 'Halvard', text: 'I see. The ink is dry on your decision. You will live with whatever follows.' },
        ],
        next: 'ep7_to_future',
    },
    ep7_mara_lobby_verdict: {
        lines: [
            { who: 'mara', speaker: 'Mara', text: 'You said what you needed to say. I am proud of you. Genuinely.' },
        ],
        next: null,
    },
    ep7_tara_final_advice: {
        lines: [
            { who: 'tara', speaker: 'Tara Patel', text: 'My assignment at Northlight ends on Friday. You are one of the few leads I respect. Do not let anyone take that from you.' },
        ],
        next: null,
    },
    ep7_to_future: {
        lines: [
            { who: 'narration', speaker: 'SUNDAY AFTERNOON', text: 'Sunday dinner at your family\'s home. The smell of rosemary roast and Yorkshire puddings.' },
        ],
        next: null,
        beatOnEnd: 'ep7_future',
        sceneOnEnd: 'family',
        dayLabelOnEnd: 'SUNDAY - 2:00 PM',
        unlockOnEnd: ['family', 'bar', 'rooftop'],
    },
    ep7_family_future: {
        seatAt: 'family_table',
        lines: [
            { who: 'family', speaker: 'Dad', text: 'Look at you. Two years ago you were biting your fingernails waiting for an interview call.' },
            { who: 'family', speaker: 'Mum', text: 'The food is hot, your father is healthy, and you are sitting at my table. That is all the success I care about.' },
            { who: 'sister', speaker: 'Iris', text: 'Hear, hear. To surviving the machine.' },
        ],
        choices: [
            {
                text: '"To family. The only thing that remains when the credits roll."',
                hint: 'Celebrate the bond that held',
                deltas: { family_bond: 25, burnout: -15 },
                seeds: { chose_family: true, dad_recovered_proud: true },
                log: 'You celebrated the final Sunday dinner surrounded by family.',
                next: null,
            },
        ],
    },
    ep7_priya_toast: {
        seatAt: 'bar_priya',
        lines: [
            { who: 'friend', speaker: 'Priya', text: 'To the end of the beginning. You made a masterpiece, you kept your friends, and my sister even admitted you were competent.' },
            { who: 'player', speaker: 'You', text: 'We raise a toast under the warm amber lamps of the Lamplighter. The world feels wide open.' },
        ],
        onEnter: { deltas: { friend_closeness: 15, burnout: -10 } },
        next: null,
    },
    ep7_crossroads_choice: {
        seatAt: 'roof_edge',
        lines: [
            { who: 'narration', speaker: 'Northlight Rooftop', text: 'Twilight over the metropolis. The red beacons blinking on the towers, the gentle hum of traffic eleven floors below.' },
            { who: 'player', speaker: 'You', text: 'Two years of choices. Every room, every promise, every late-night compromise. This is where my future begins.' },
        ],
        choices: [
            {
                text: 'Found a worker-owned co-op studio with Jonah, Theo, Nadia, and Priya.',
                hint: 'Ending 1: The Independent Co-op — Free, collaborative, human',
                deltas: { burnout: -25, jonah_closeness: 20, theo_trust: 20, nadia_trust: 20 },
                seeds: { founded_worker_coop: true, unlocked_coop_timeline: true },
                log: 'Ending: You founded an independent worker-owned co-operative studio, building games without corporate compromise.',
                next: 'ep7_ending_coop',
            },
            {
                text: 'Step up as Studio Director at Vantage to reform the studio from within.',
                hint: 'Ending 2: The Studio Director — Power, executive authority, institutional reform',
                deltas: { mara_trust: 15, burnout: 10 },
                seeds: { stayed_vantage_director: true },
                log: 'Ending: You became Studio Director of Northlight, wielding executive leadership to protect the next generation.',
                next: 'ep7_ending_director',
            },
            {
                text: 'Walk away from game development entirely. Move home and build with your dad.',
                hint: 'Ending 3: The Peaceful Horizon — Wholeness, craft, family',
                deltas: { family_bond: 30, burnout: -35 },
                seeds: { walked_away_clean: true, dad_recovered_proud: true },
                log: 'Ending: You chose life over the machine, returning home to build timber boats and cherish family.',
                next: 'ep7_ending_family',
            },
        ],
    },
    ep7_ending_coop: {
        lines: [
            { who: 'narration', speaker: 'A NEW HORIZON', text: 'A small brick studio above a bakery. Five desks, shared equity, four-day work weeks, and no publisher board.' },
            { who: 'player', speaker: 'You', text: 'We made our own room. And for the first time, it belongs entirely to us.' },
        ],
        next: 'ep7_final_close',
    },
    ep7_ending_director: {
        lines: [
            { who: 'narration', speaker: 'THE CORNER OFFICE', text: 'The glass office with your name on the door. You look out over the forty desks of Northlight.' },
            { who: 'player', speaker: 'You', text: 'I am the person in charge now. And I will make sure nobody bleeds for a spreadsheet again.' },
        ],
        next: 'ep7_final_close',
    },
    ep7_ending_family: {
        lines: [
            { who: 'narration', speaker: 'THE WORKSHOP', text: 'The scent of cedar shavings, sawdust, and sea salt. Your dad smiling as you hand him the hand plane.' },
            { who: 'player', speaker: 'You', text: 'Forty-one years my dad built things with his hands. Now we build them together.' },
        ],
        next: 'ep7_final_close',
    },
    ep7_final_close: {
        lines: [
            { who: 'narration', speaker: 'SHIFT — SERIES COMPLETE', text: 'Every choice had a cost. Every room kept its memory. Thank you for living this journey.' },
            { who: 'player', speaker: 'You', text: 'A shift in perspective. A shift in life.' },
        ],
        next: null,
        beatOnEnd: 'ep7_epilogue',
        unlockOnEnd: ['studio', 'home', 'bar', 'family', 'publisher', 'rooftop', 'clinic', 'hospital'],
    },
    ep7_dad_farewell: {
        lines: [
            { who: 'family', speaker: 'Dad', text: 'Good to see you, son. Pull up a chair. The tea is hot and the world can wait.' },
        ],
        onEnter: { deltas: { family_bond: 5, burnout: -5 } },
        next: null,
    },
};
