/**
 * UI-facing store. The 3D world reads it for mood/scene, React reads it for the
 * dialogue overlay, labels and phone.
 */
import { useSyncExternalStore } from 'react';
import { freshState, type GameState } from './gameState.ts';

export interface DialogueRuntime {
    nodeId: string;
    lineIndex: number;
    /** True once the typewriter has finished the current line. */
    lineDone: boolean;
}

export interface MusicTrack {
    title: string;
    file: string;
    artist: string;
}

export interface AudioPlayerState {
    mainPlaying: boolean;
    phonePlaying: boolean;
    currentTrackIndex: number;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    playlist: MusicTrack[];
}

export interface AppState {
    phase: 'loading' | 'menu' | 'playing';
    loadProgress: number;
    paused: boolean;
    hasSave: boolean;
    /** True when the save could not be read — writes are blocked until resolved. */
    saveUnavailable: boolean;
    game: GameState;
    dialogue: DialogueRuntime | null;
    /** Player is walking to a destination; labels hide while true. */
    walking: boolean;
    phoneOpen: boolean;
    travelOpen: boolean;
    episodeEndOpen: boolean;
    /** True from the moment a sleep beat ends until the next morning opens. */
    sleeping: boolean;
    unread: number;
    audio: AudioPlayerState;
}

export const R2_MUSIC_BASE = 'https://pub-d7c3135bfc1c4c92ba9902f5bc0199f7.r2.dev/music/';
export const MAIN_THEME_URL = `${R2_MUSIC_BASE}Main%20music.mp3`;

export const INITIAL_PLAYLIST: MusicTrack[] = [
    { title: 'Lamplighter', file: 'Lamplighter.mp3', artist: 'Incompetech' },
    { title: 'Aces High', file: 'Aces High.mp3', artist: 'Incompetech' },
    { title: 'District Four', file: 'District Four.mp3', artist: 'Incompetech' },
    { title: 'RetroFuture Dirty', file: 'RetroFuture Dirty.mp3', artist: 'Incompetech' },
    { title: 'Life of Riley', file: 'Life of Riley.mp3', artist: 'Incompetech' },
    { title: 'Somewhere Sunny', file: 'Somewhere Sunny.mp3', artist: 'Incompetech' },
    { title: 'Loopster', file: 'Loopster.mp3', artist: 'Incompetech' },
    { title: 'C-Funk', file: 'C-Funk.mp3', artist: 'Incompetech' },
    { title: 'Clear Air', file: 'Clear Air.mp3', artist: 'Incompetech' },
    { title: 'Celebration', file: 'Celebration.mp3', artist: 'Incompetech' },
    { title: 'Smooth Move', file: 'Smooth Move.mp3', artist: 'Incompetech' },
    { title: 'Funkorama', file: 'Funkorama.mp3', artist: 'Incompetech' },
    { title: 'Guts and Bourbon', file: 'Guts and Bourbon.mp3', artist: 'Incompetech' },
    { title: 'Flutey Funk', file: 'Flutey Funk.mp3', artist: 'Incompetech' },
    { title: 'Your Call', file: 'Your Call.mp3', artist: 'Incompetech' },
    { title: 'Private Eye', file: 'Private Eye.mp3', artist: 'Incompetech' },
    { title: 'Honey Bee', file: 'Honey Bee.mp3', artist: 'Incompetech' },
    { title: 'Enter the Party', file: 'Enter the Party.mp3', artist: 'Incompetech' },
    { title: 'Sunshine A', file: 'Sunshine A.mp3', artist: 'Incompetech' },
    { title: 'Werq', file: 'Werq.mp3', artist: 'Incompetech' },
    { title: 'There It Is', file: 'There It Is.mp3', artist: 'Incompetech' },
    { title: 'StyleFunk', file: 'StyleFunk.mp3', artist: 'Incompetech' },
    { title: 'Funky Chunk', file: 'Funky Chunk.mp3', artist: 'Incompetech' },
    { title: 'Blown Away', file: 'Blown Away - No Percussion.mp3', artist: 'Incompetech' },
];

const listeners = new Set<() => void>();

let state: AppState = {
    phase: 'loading',
    loadProgress: 0,
    paused: false,
    hasSave: false,
    saveUnavailable: false,
    game: freshState(),
    dialogue: null,
    walking: false,
    phoneOpen: false,
    travelOpen: false,
    episodeEndOpen: false,
    sleeping: false,
    unread: 0,
    audio: {
        mainPlaying: false,
        phonePlaying: false,
        currentTrackIndex: 0,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        isMuted: false,
        playlist: INITIAL_PLAYLIST,
    },
};

export const store = {
    get: (): AppState => state,
    patch(partial: Partial<AppState>): void {
        state = { ...state, ...partial };
        for (const listener of listeners) listener();
    },
    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};

export function useStore<T = AppState>(selector: (s: AppState) => T = (s) => s as unknown as T): T {
    return useSyncExternalStore(store.subscribe, () => selector(state));
}

/* -------------------------------------------------------------------------- */
/*                        AUDIO ENGINE & PLAYBACK CONTROLLER                  */
/* -------------------------------------------------------------------------- */

const isBrowser = typeof window !== 'undefined' && typeof Audio !== 'undefined';
let mainAudio: HTMLAudioElement | null = null;
let phoneAudio: HTMLAudioElement | null = null;
let saveInterval: ReturnType<typeof setInterval> | null = null;

if (isBrowser) {
    mainAudio = new Audio(MAIN_THEME_URL);
    mainAudio.loop = true;
    mainAudio.volume = state.audio.volume;

    // Restore saved playback position from previous session or refresh
    try {
        const saved = parseFloat(localStorage.getItem('shift_main_music_time') || '0');
        if (!isNaN(saved) && saved > 0) {
            mainAudio.currentTime = saved;
        }
    } catch { }

    // Save playback position periodically
    saveInterval = setInterval(() => {
        if (mainAudio && !mainAudio.paused && mainAudio.currentTime > 0) {
            try {
                localStorage.setItem('shift_main_music_time', mainAudio.currentTime.toFixed(2));
            } catch { }
        }
    }, 2000);

    phoneAudio = new Audio();
    phoneAudio.loop = false;
    phoneAudio.preload = 'metadata';
    phoneAudio.volume = state.audio.volume;

    // Pre-assign source to the first track so it is instantly ready
    try {
        const firstTrack = INITIAL_PLAYLIST[0];
        if (firstTrack) {
            phoneAudio.src = `${R2_MUSIC_BASE}${encodeURIComponent(firstTrack.file)}`;
        }
    } catch { }

    phoneAudio.addEventListener('loadedmetadata', () => {
        if (!phoneAudio) return;
        store.patch({
            audio: {
                ...state.audio,
                duration: isNaN(phoneAudio.duration) ? 0 : phoneAudio.duration,
                currentTime: phoneAudio.currentTime || 0,
            },
        });
    });

    phoneAudio.addEventListener('play', () => {
        store.patch({
            audio: {
                ...state.audio,
                phonePlaying: true,
                mainPlaying: false,
            },
        });
    });

    phoneAudio.addEventListener('pause', () => {
        store.patch({
            audio: {
                ...state.audio,
                phonePlaying: false,
            },
        });
    });

    phoneAudio.addEventListener('timeupdate', () => {
        if (!phoneAudio) return;
        const cur = phoneAudio.currentTime || 0;
        const dur = phoneAudio.duration || 0;
        store.patch({
            audio: {
                ...state.audio,
                currentTime: cur,
                duration: isNaN(dur) ? 0 : dur,
            },
        });
    });

    phoneAudio.addEventListener('ended', () => {
        audioManager.nextPhone();
    });

    phoneAudio.addEventListener('error', () => {
        console.warn('Audio playback error on track, skipping to next track.');
        setTimeout(() => {
            audioManager.nextPhone();
        }, 600);
    });

    // Auto-unlock audio on first user touch/click/key if browser blocks initial autoplay
    const unlockAutoplay = () => {
        if (!state.audio.phonePlaying) {
            audioManager.playMain();
        }
        window.removeEventListener('pointerdown', unlockAutoplay);
        window.removeEventListener('keydown', unlockAutoplay);
        window.removeEventListener('touchstart', unlockAutoplay);
    };

    window.addEventListener('pointerdown', unlockAutoplay, { passive: true });
    window.addEventListener('keydown', unlockAutoplay, { passive: true });
    window.addEventListener('touchstart', unlockAutoplay, { passive: true });

    // Initial attempt to start main music
    setTimeout(() => {
        audioManager.playMain();
    }, 400);
}

export const audioManager = {
    /** Play the main theme song (Main music.mp3). Strictly stops if phone music is active. */
    playMain(): void {
        if (!mainAudio) return;
        if (state.audio.phonePlaying) return; // Never play at the same time
        mainAudio.volume = state.audio.isMuted ? 0 : state.audio.volume;
        mainAudio.play().then(() => {
            store.patch({
                audio: { ...state.audio, mainPlaying: true },
            });
        }).catch(() => {
            // Autoplay blocked by browser policy; will unlock on user interaction
        });
    },

    /** Pause the main theme song. */
    pauseMain(): void {
        if (!mainAudio) return;
        mainAudio.pause();
        store.patch({
            audio: { ...state.audio, mainPlaying: false },
        });
    },

    /** Play a track from the phone MP3 player. IMMEDIATELY halts Main music.mp3. */
    playPhone(index?: number): void {
        if (!phoneAudio) return;
        const targetIndex = typeof index === 'number' ? index : state.audio.currentTrackIndex;
        const track = state.audio.playlist[targetIndex];
        if (!track) return;

        // STOP Main music.mp3 immediately
        this.pauseMain();

        const encodedFile = track.file.includes('/')
            ? track.file.split('/').map(encodeURIComponent).join('/')
            : encodeURIComponent(track.file);
        const fullUrl = `${R2_MUSIC_BASE}${encodedFile}`;

        if (phoneAudio.src !== fullUrl) {
            phoneAudio.src = fullUrl;
        }

        phoneAudio.volume = state.audio.isMuted ? 0 : state.audio.volume;

        // Optimistically set playing state immediately for instant UI responsiveness
        store.patch({
            audio: {
                ...state.audio,
                mainPlaying: false,
                phonePlaying: true,
                currentTrackIndex: targetIndex,
            },
        });

        const promise = phoneAudio.play();
        if (promise !== undefined) {
            promise.catch((err) => {
                console.warn('Phone audio playback error on:', fullUrl, err);
                store.patch({
                    audio: { ...state.audio, phonePlaying: false },
                });
                // If it failed, resume main music
                this.playMain();
            });
        }
    },

    /** Pause the phone MP3 player. IMMEDIATELY resumes Main music.mp3. */
    pausePhone(): void {
        if (!phoneAudio) return;
        phoneAudio.pause();
        store.patch({
            audio: { ...state.audio, phonePlaying: false },
        });
        // Main music.mp3 resumes immediately when phone music pauses
        this.playMain();
    },

    /** Toggle play/pause for the phone MP3 player. */
    togglePhone(): void {
        if (!phoneAudio) return;
        if (state.audio.phonePlaying || !phoneAudio.paused) {
            this.pausePhone();
        } else {
            this.playPhone();
        }
    },

    /** Advance to the next track on the phone MP3 player. */
    nextPhone(): void {
        const nextIdx = (state.audio.currentTrackIndex + 1) % state.audio.playlist.length;
        this.playPhone(nextIdx);
    },

    /** Go back to the previous track on the phone MP3 player. */
    prevPhone(): void {
        const prevIdx = (state.audio.currentTrackIndex - 1 + state.audio.playlist.length) % state.audio.playlist.length;
        this.playPhone(prevIdx);
    },

    /** Seek within the phone track (ratio 0..1). */
    seekPhone(ratio: number): void {
        if (!phoneAudio || !phoneAudio.duration) return;
        const clamped = Math.max(0, Math.min(1, ratio));
        phoneAudio.currentTime = clamped * phoneAudio.duration;
    },

    /** Set global volume (0..1). */
    setVolume(vol: number): void {
        const clamped = Math.max(0, Math.min(1, vol));
        if (mainAudio) mainAudio.volume = state.audio.isMuted ? 0 : clamped;
        if (phoneAudio) phoneAudio.volume = state.audio.isMuted ? 0 : clamped;
        store.patch({
            audio: { ...state.audio, volume: clamped },
        });
    },

    /** Toggle mute. */
    toggleMute(): void {
        const nextMute = !state.audio.isMuted;
        if (mainAudio) mainAudio.volume = nextMute ? 0 : state.audio.volume;
        if (phoneAudio) phoneAudio.volume = nextMute ? 0 : state.audio.volume;
        store.patch({
            audio: { ...state.audio, isMuted: nextMute },
        });
    },

    /** Add a custom track filename from R2 into the phone playlist. */
    addCustomTrack(file: string, title?: string, artist = 'Custom R2'): void {
        const cleanFile = file.trim();
        if (!cleanFile) return;
        const cleanTitle = title?.trim() || cleanFile.replace(/\.[^/.]+$/, '');
        const newTrack: MusicTrack = {
            title: cleanTitle,
            file: cleanFile,
            artist,
        };
        const updated = [...state.audio.playlist, newTrack];
        store.patch({
            audio: { ...state.audio, playlist: updated },
        });
        this.playPhone(updated.length - 1);
    },
};
