/**
 * Story runtime: opens nodes, advances lines, applies choice effects to the
 * dual-sphere state, moves the story between beats and scenes, and persists
 * after every meaningful change.
 */
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { store } from '../state/store.ts';
import {
    applyConsequences, applyDeltas, REPLIES, saveState,
    type GameState, type PhoneMessage, type StatKey,
} from '../state/gameState.ts';
import { INTERACTIONS, NODES, OBJECTIVES, type Choice, type Interaction } from './story.ts';
import { ANCHORS, LOCATIONS, openLocations, type LocationInfo, type SceneId } from '../world/anchors.ts';

export function track(event: string, props?: Record<string, string | number | boolean>) {
    try {
        RundotGameAPI.analytics.recordCustomEvent(event, props);
    } catch {
        /* analytics unavailable outside the RUN host */
    }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
/** The most recent state handed to persist(), so a flush can never miss it. */
let pendingGame: GameState | null = null;

/**
 * Save shortly after a change. Writes are batched so a burst of choices does not
 * hammer storage — but the pending state is remembered so flushPersist() can
 * commit it immediately if the app is closing.
 */
export function persist(game: GameState) {
    pendingGame = game;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        persistTimer = null;
        const g = pendingGame;
        pendingGame = null;
        if (g) void saveState(g);
    }, 250);
}

/**
 * Save right now, without waiting for the batch window. Used at the points a
 * player would be upset to lose: a choice made, a node opened, a beat advanced.
 * A refresh a moment later must never cost them a scene.
 */
export function persistNow(game: GameState) {
    if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
    }
    pendingGame = null;
    void saveState(game);
}

/**
 * Commit any batched save right now. Called when the host tells us the app is
 * going to sleep or quitting, so the last thing a player did is never lost.
 */
export function flushPersist(fallback?: GameState) {
    if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
    }
    const g = pendingGame ?? fallback;
    pendingGame = null;
    if (g) void saveState(g);
}

/** Interactions currently available, deduped by id (first match wins). */
export function activeInteractions(game: GameState): Interaction[] {
    const out: Interaction[] = [];
    const seen = new Set<string>();
    for (const it of INTERACTIONS) {
        if (!it.beats.includes(game.beat)) continue;
        if (seen.has(it.id)) continue;
        if (it.once && game.visited.includes(it.node)) continue;
        // Not available until its prerequisite scene has been played.
        if (it.needs && !game.visited.includes(it.needs)) continue;
        seen.add(it.id);
        out.push(it);
    }
    return out;
}

/** The interaction that advances the story in the current beat, if any. */
export function keyInteraction(game: GameState): Interaction | null {
    return activeInteractions(game).find((i) => i.key) ?? null;
}

/**
 * Current objective for the guidance banner.
 *
 * The hint is always derived from where the player actually IS, never from a
 * fixed line of text. Three cases:
 *   - the next step is in another location  -> name that location
 *   - the next step is in this room         -> name the action
 *   - there is no next step yet             -> the beat's own flavour line
 * This is why the beat hints in story.ts must not contain travel directions.
 */
export function objective(game: GameState): { title: string; hint: string } | null {
    const base = OBJECTIVES[game.beat];
    if (!base) return null;

    const key = keyInteraction(game);
    if (!key) {
        // Nothing to do yet in this beat: any remaining optional scene is enough.
        const optional = activeInteractions(game)[0];
        if (!optional) return base;
        const spot = ANCHORS[optional.id];
        if (spot && spot.scene !== game.scene) {
            return {
                title: base.title,
                hint: `Nothing here for now — ${locationName(spot.scene)} is open to you.`,
            };
        }
        return base;
    }

    const entry = ANCHORS[key.id];
    if (!entry) return base;

    // The key action is somewhere else: name where to go.
    if (entry.scene !== game.scene) {
        return {
            title: base.title,
            hint: `Go to ${locationName(entry.scene)} — use Travel, top left.`,
        };
    }

    // Already in the right room: name the action, and say it is nearby.
    return {
        title: base.title,
        hint: `You are here. Tap "${key.label}" to carry on.`,
    };
}

/**
 * Which character body the camera/cast should engage for a node. Several
 * characters have a body in more than one location (Mara at her desk and on the
 * roof, for instance), so the node's own scene decides which one turns to you.
 */
const ROOF_BODY: Record<string, string> = {
    mara: 'maraRoof', jonah: 'jonahRoof', theo: 'theoRoof',
};

export function nodeFocus(nodeId: string): string | null {
    const node = NODES[nodeId];
    if (!node) return null;
    const scene = node.sceneOnEnter ?? store.get().game.scene;
    for (const line of node.lines) {
        const who = line.who;
        if (who === 'mara' || who === 'jonah' || who === 'theo') {
            return scene === 'rooftop' ? ROOF_BODY[who] : who;
        }
        if (who === 'priya') return 'priya';
        if (who === 'friend') return 'priya';
        if (who === 'sister') return 'sister';
        if (who === 'family') return 'mum';
        if (who === 'nadia') return 'nadia';
        if (who === 'tara') return 'tara';
        // The clinic doctor borrows the 'exec' speaker slot.
        if (who === 'exec') return scene === 'clinic' ? 'doctor' : 'exec';
    }
    return null;
}

function applyEffects(game: GameState, effect: Partial<Choice>): GameState {
    let next = effect.deltas ? applyDeltas(game, effect.deltas) : { ...game };
    if (effect.seeds) next.legacy_seeds = { ...next.legacy_seeds, ...effect.seeds };
    if (effect.unlock) {
        const added = effect.unlock.filter((id) => !next.unlocked.includes(id as SceneId)) as SceneId[];
        if (added.length > 0) next.unlocked = [...next.unlocked, ...added];
    }
    if (effect.beat) next.beat = effect.beat;
    if (effect.scene) next.scene = effect.scene;
    if (effect.dayLabel) next.dayLabel = effect.dayLabel;
    if (effect.promote) next.promoted = true;
    if (effect.message) next.messages = [...next.messages, effect.message];
    if (effect.log) next.log = [...next.log, effect.log];
    // A meter reaching its edge changes the story: someone resigns, or your body
    // makes the decision for you.
    next = applyConsequences(next);
    return next;
}

export function openNode(nodeId: string) {
    const node = NODES[nodeId];
    if (!node) return;
    const s = store.get();
    let game: GameState = { ...s.game, node: nodeId };
    if (!game.visited.includes(nodeId)) game.visited = [...game.visited, nodeId];
    // Move location BEFORE the lines play, so the right people are present.
    if (node.sceneOnEnter) game.scene = node.sceneOnEnter;
    if (node.dayLabelOnEnter) game.dayLabel = node.dayLabelOnEnter;
    if (node.onEnter) game = applyEffects(game, node.onEnter);
    // Promotion is earned, not scripted: Mara's trust buys you the better desk.
    if (game.mara_trust >= 62 && !game.promoted) game.promoted = true;
    const unread = s.unread + (node.onEnter?.message ? 1 : 0);
    store.patch({ game, dialogue: { nodeId, lineIndex: 0, lineDone: false }, walking: false, unread });
    persistNow(game);
    track('story_node_opened', { node: nodeId, beat: game.beat });
}

function endNode(nodeId: string) {
    const node = NODES[nodeId];
    const s = store.get();
    const game: GameState = { ...s.game };
    if (node?.unlockOnEnd) {
        const added = node.unlockOnEnd.filter((id) => !game.unlocked.includes(id as SceneId)) as SceneId[];
        if (added.length > 0) {
            game.unlocked = [...game.unlocked, ...added];
            for (const id of added) {
                track('location_unlocked', { location: id, beat: node.beatOnEnd ?? game.beat });
            }
        }
    }
    if (node?.beatOnEnd) game.beat = node.beatOnEnd;
    if (node?.sceneOnEnd) game.scene = node.sceneOnEnd;
    if (node?.dayLabelOnEnd) game.dayLabel = node.dayLabelOnEnd;
    game.node = null;
    store.patch({ game, dialogue: null });
    persistNow(game);
    if (node?.next) {
        // A sleep beat holds on black for a moment before the next morning.
        if (node.sleep) {
            track('story_slept', { node: nodeId });
            store.patch({ sleeping: true });
            setTimeout(() => {
                store.patch({ sleeping: false });
                openNode(node.next!);
            }, 1500);
        } else {
            openNode(node.next);
        }
        return;
    }
    track('story_node_closed', { node: nodeId, beat: game.beat });
}

/** Tap-to-advance: finish the typewriter, then step to the next line. */
export function advance() {
    const s = store.get();
    const d = s.dialogue;
    if (!d) return;
    const node = NODES[d.nodeId];
    if (!node) return;
    if (!d.lineDone) {
        store.patch({ dialogue: { ...d, lineDone: true } });
        return;
    }
    if (d.lineIndex < node.lines.length - 1) {
        store.patch({ dialogue: { nodeId: d.nodeId, lineIndex: d.lineIndex + 1, lineDone: false } });
        return;
    }
    if (node.choices && node.choices.length > 0) return; // waiting on the player
    endNode(d.nodeId);
}

export function markLineDone() {
    const s = store.get();
    if (s.dialogue && !s.dialogue.lineDone) store.patch({ dialogue: { ...s.dialogue, lineDone: true } });
}

export function pickChoice(index: number) {
    const s = store.get();
    const d = s.dialogue;
    if (!d) return;
    const node = NODES[d.nodeId];
    const choice = node?.choices?.[index];
    if (!choice) return;

    let game = applyEffects(s.game, choice);
    if (game.mara_trust >= 62) game.promoted = true;
    const unread = s.unread + (choice.message ? 1 : 0);
    game.node = null;
    store.patch({ game, dialogue: null, unread });
    persistNow(game);

    track('dialogue_choice_selected', {
        node: d.nodeId,
        choice: choice.text.slice(0, 60),
        burnout: game.burnout,
        mara_trust: game.mara_trust,
        family_bond: game.family_bond,
    });

    if (choice.next) {
        openNode(choice.next);
    } else {
        endNode(d.nodeId);
    }
}

/**
 * Reply options for a message, or an empty list. A message can be answered only
 * if it carries a thread, has not been answered, and is not a character's
 * reply-back — which is what previously caused the endless Reply loop.
 */
export function replyOptionsFor(message: PhoneMessage) {
    if (!message.thread) return [];
    if (message.reply) return [];
    if (message.isReplyBack) return [];
    return REPLIES[message.thread] ?? [];
}

/** True when this message is still waiting on an answer from the player. */
export function canReply(message: PhoneMessage): boolean {
    return replyOptionsFor(message).length > 0;
}

/** How many messages are still unanswered — shown on the phone badge. */
export function pendingReplies(game: GameState): number {
    return game.messages.filter(canReply).length;
}

/**
 * Send a reply. This consumes the message (it can never be answered twice), and
 * anything the character sends back arrives as a closed message so the thread
 * cannot loop.
 */
export function sendReply(index: number, optionIndex: number) {
    const s = store.get();
    const message = s.game.messages[index];
    if (!message) return;
    const options = replyOptionsFor(message);
    const option = options[optionIndex];
    if (!option) return;

    let game: GameState = option.deltas
        ? applyDeltas(s.game, option.deltas as Partial<Record<StatKey, number>>)
        : { ...s.game };
    game = applyConsequences(game);

    const messages = [...game.messages];
    // Answering closes this message for good.
    messages[index] = { ...message, reply: option.text };
    if (option.back) {
        // A reply-back is read-only: no thread, flagged as a reply-back.
        messages.push({
            from: message.from,
            text: option.back,
            tone: message.tone,
            isReplyBack: true,
        });
    }
    game = { ...game, messages };
    if (game.mara_trust >= 62) game.promoted = true;
    store.patch({ game });
    persistNow(game);

    track('message_reply_sent', {
        thread: message.thread ?? 'none',
        to: message.from,
        reply: option.text.slice(0, 60),
        burnout: game.burnout,
        family_bond: game.family_bond,
        friend_closeness: game.friend_closeness,
    });
}

/**
 * Locations the player can travel to right now.
 *
 * Safety net: wherever the CURRENT objective lives is always included. A beat
 * whose key action sits in a location that was left out of that location's
 * openIn list would otherwise strand the player with an instruction they cannot
 * follow — which is exactly what happened with the Northlight roof.
 */
export function travelOptions(game: GameState): LocationInfo[] {
    const out = openLocations(game.beat, game.unlocked);
    const key = keyInteraction(game);
    const needed = key ? ANCHORS[key.id]?.scene : undefined;
    if (needed && !out.some((l: LocationInfo) => l.id === needed)) {
        const loc = LOCATIONS[needed];
        if (loc) out.push(loc);
    }
    return out;
}

/** Move the story to another location. */
export function travelTo(scene: SceneId) {
    const s = store.get();
    if (s.game.scene === scene) return;
    // Reachable if unlocked, or if the current objective lives there.
    const allowed = travelOptions(s.game).some((l) => l.id === scene);
    if (!allowed) return;
    const game: GameState = { ...s.game, scene };
    // Arriving somewhere counts as discovering it.
    if (!game.unlocked.includes(scene)) game.unlocked = [...game.unlocked, scene];
    // Close every overlay and clear transient state, so nothing from the room
    // being left survives the journey.
    store.patch({ game, travelOpen: false, phoneOpen: false, walking: false });
    persistNow(game);
    track('travel_completed', { to: scene, beat: game.beat, from: s.game.scene });
}

/** Display name for a location id. */
export function locationName(scene: SceneId): string {
    return LOCATIONS[scene]?.name ?? 'Somewhere';
}

/** 0 = daylight, 1 = deep night. Drives lighting in every location. */
export function nightFactor(dayLabel: string): number {
    const match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(dayLabel);
    if (!match) return 0;
    let hour = parseInt(match[1], 10) % 12;
    const minutes = parseInt(match[2], 10);
    if (match[3].toUpperCase() === 'PM') hour += 12;
    const t = hour + minutes / 60;
    if (t >= 8 && t <= 17) return 0;
    if (t > 17 && t < 21) return (t - 17) / 4;
    if (t >= 21 || t < 4) return 1;
    return Math.max(0, 1 - (t - 4) / 4);
}
