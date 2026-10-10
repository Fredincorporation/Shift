import { useState } from 'react';
import { audioManager, store, useStore } from '../state/store.ts';
import { locationName, pendingReplies, replyOptionsFor, sendReply, track } from '../story/runtime.ts';

function formatTime(sec: number): string {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function MeterCard({ label, value, tint, icon, inverse }: { label: string; value: number; tint: string; icon: string; inverse?: boolean }) {
    const level = inverse ? 100 - value : value;
    const mood = level > 66 ? 'good' : level > 33 ? 'mid' : 'bad';
    return (
        <div className="phone-stat-card">
            <div className="phone-stat-header">
                <span className="phone-stat-icon">{icon}</span>
                <span className="phone-stat-title">{label}</span>
                <span className={'phone-stat-num ' + mood}>{Math.round(value)}%</span>
            </div>
            <div className="phone-progress-track">
                <div className="phone-progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: tint }} />
            </div>
        </div>
    );
}

export default function PhoneOverlay() {
    const open = useStore((s) => s.phoneOpen);
    const unread = useStore((s) => s.unread);
    const game = useStore((s) => s.game);
    const dialogue = useStore((s) => s.dialogue);
    const audioState = useStore((s) => s.audio);
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'stats' | 'notes'>('chat');
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [customFileName, setCustomFileName] = useState('');

    const toggle = () => {
        const next = !store.get().phoneOpen;
        store.patch({ phoneOpen: next, unread: next ? 0 : store.get().unread });
        if (!next) setReplyTo(null);
        track(next ? 'phone_opened' : 'phone_closed', { beat: game.beat });
    };

    const workStanding = Math.round(game.mara_trust * 0.6 + game.jonah_closeness * 0.25 + game.theo_trust * 0.15);
    const thread = game.messages.map((message, index) => ({ message, index })).reverse();
    const waiting = pendingReplies(game);
    const badge = Math.max(unread, waiting);

    // Realistic time display extracted from dayLabel or fallback
    const timeDisplay = game.dayLabel.includes('-') ? game.dayLabel.split('-')[1]?.trim() : '21:42';

    return (
        <>
            {!dialogue && (
                <button type="button" className="phone-fab" onClick={toggle} aria-label="Phone">
                    <span className="phone-icon" />
                    {badge > 0 && !open && <span className="badge">{badge}</span>}
                </button>
            )}

            {open && (
                <div className="phone-layer" onClick={toggle}>
                    <div className="phone-body phone-chassis" onClick={(e) => e.stopPropagation()}>
                        {/* Status bar with dynamic island notch */}
                        <div className="phone-header-bar">
                            <span className="phone-clock">{timeDisplay}</span>
                            <div className="phone-dynamic-island">
                                <span className="island-lens" />
                            </div>
                            <div className="phone-status-icons">
                                <span className="signal-icon">●●●</span>
                                <span className="battery-icon">86%</span>
                            </div>
                        </div>

                        {/* Location subtitle */}
                        <div className="phone-sub-bar">
                            <span className="phone-day-tag">{game.dayLabel.split('-')[0]?.trim()}</span>
                            <span className="phone-location-tag">📍 {locationName(game.scene)}</span>
                        </div>

                        {/* Top Nav App Tabs */}
                        <div className="phone-tab-bar">
                            <button
                                type="button"
                                className={`phone-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                Messages {waiting > 0 && <span className="tab-bubble">{waiting}</span>}
                            </button>
                            <button
                                type="button"
                                className={`phone-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                                onClick={() => setActiveTab('stats')}
                            >
                                Vitals
                            </button>
                            <button
                                type="button"
                                className={`phone-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                Log
                            </button>
                        </div>

                        {/* Scroll Content Area */}
                        <div className="phone-scroll">
                            {activeTab === 'chat' && (
                                <div className="chat-thread-container">
                                    {thread.length === 0 ? (
                                        <div className="phone-empty-state">No new messages</div>
                                    ) : (
                                        thread.map(({ message, index }) => {
                                            const options = replyOptionsFor(message);
                                            const answerable = options.length > 0;
                                            const isOpen = replyTo === index;
                                            return (
                                                <div
                                                    key={index + message.text}
                                                    className={
                                                        'modern-bubble ' + message.tone +
                                                        (answerable ? ' is-waiting' : '') +
                                                        (message.isReplyBack ? ' is-reply' : '')
                                                    }
                                                >
                                                    <div className="bubble-header">
                                                        <span className="bubble-author">{message.from}</span>
                                                        <span className="bubble-tone-badge">{message.tone}</span>
                                                    </div>
                                                    <p className="bubble-text">{message.text}</p>

                                                    {message.reply && (
                                                        <div className="bubble-sent-reply">
                                                            <span className="sent-tag">You:</span>
                                                            <span className="sent-text">{message.reply}</span>
                                                        </div>
                                                    )}

                                                    {answerable && !isOpen && (
                                                        <button
                                                            type="button"
                                                            className="reply-pill-btn"
                                                            onClick={() => {
                                                                setReplyTo(index);
                                                                track('message_reply_opened', {
                                                                    thread: message.thread ?? 'none',
                                                                    from: message.from,
                                                                });
                                                            }}
                                                        >
                                                            ✍️ Reply
                                                        </button>
                                                    )}

                                                    {answerable && isOpen && (
                                                        <div className="reply-selection-sheet">
                                                            <span className="reply-sheet-prompt">Choose your response:</span>
                                                            {options.map((option, optionIndex) => (
                                                                <button
                                                                    key={option.text}
                                                                    type="button"
                                                                    className="reply-card-btn"
                                                                    onClick={() => {
                                                                        sendReply(index, optionIndex);
                                                                        setReplyTo(null);
                                                                    }}
                                                                >
                                                                    <span className="reply-card-text">{option.text}</span>
                                                                    <span className="reply-card-hint">{option.hint}</span>
                                                                </button>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                className="reply-cancel-btn"
                                                                onClick={() => setReplyTo(null)}
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {activeTab === 'stats' && (
                                <div className="phone-vitals-container">
                                    <div className="vitals-headline">Status & Relationships</div>
                                    <MeterCard label="Burnout Risk" value={game.burnout} tint="#ff6b4a" icon="🔥" inverse />
                                    <MeterCard label="Studio Standing" value={workStanding} tint="#4bb2ff" icon="💼" />
                                    <MeterCard label="Family Closeness" value={game.family_bond} tint="#f2729a" icon="🏡" />
                                    <MeterCard label="Social & Priya" value={game.friend_closeness} tint="#a085fd" icon="🍻" />

                                    <div className="vitals-insight">
                                        {game.burnout > 65
                                            ? '⚠️ You are exhausted. Personal connections fray as crunch mounts.'
                                            : game.burnout > 35
                                                ? '⚡ Tension is building. Make time to recharge before the slice.'
                                                : '✨ You are holding steady. Work and life are in fragile balance.'}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="phone-notes-container">
                                    <div className="notes-section-title">Known Locations</div>
                                    <div className="unlocked-chips">
                                        {game.unlocked.map((id) => (
                                            <span key={id} className="location-chip">📍 {locationName(id)}</span>
                                        ))}
                                    </div>

                                    <div className="notes-section-title">Journal Timeline</div>
                                    {game.log.length === 0 ? (
                                        <div className="phone-empty-state">No significant events logged yet.</div>
                                    ) : (
                                        <div className="log-timeline">
                                            {game.log.map((entry, index) => (
                                                <div key={index + entry} className="timeline-item">
                                                    <span className="timeline-dot" />
                                                    <span className="timeline-text">{entry}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Static Stylish MP3 Player pinned above the home indicator */}
                        <div className="phone-music-player" onClick={(e) => e.stopPropagation()}>
                            <div className="mp3-top">
                                <div
                                    className={`mp3-disc ${audioState.phonePlaying ? 'is-spinning' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); audioManager.togglePhone(); }}
                                    style={{ cursor: 'pointer' }}
                                    title={audioState.phonePlaying ? 'Pause' : 'Play'}
                                >
                                    <span className="mp3-disc-inner">{audioState.phonePlaying ? '⏸' : '🎵'}</span>
                                </div>
                                <div
                                    className="mp3-info"
                                    onClick={(e) => { e.stopPropagation(); audioManager.togglePhone(); }}
                                    style={{ cursor: 'pointer' }}
                                    title={audioState.phonePlaying ? 'Pause' : 'Play'}
                                >
                                    <span className="mp3-title">{audioState.playlist[audioState.currentTrackIndex]?.title ?? 'Shift Player'}</span>
                                    <span className="mp3-artist">{audioState.playlist[audioState.currentTrackIndex]?.artist ?? 'Incompetech.com'}</span>
                                </div>
                                <button
                                    type="button"
                                    className={`mp3-btn-playlist ${showPlaylist ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); setShowPlaylist((v) => !v); }}
                                    title="Playlist"
                                    aria-label="Playlist"
                                >
                                    ≡
                                </button>
                            </div>

                            {/* Scrubber / timeline */}
                            <div className="mp3-progress-row" onClick={(e) => e.stopPropagation()}>
                                <span className="mp3-time">{formatTime(audioState.currentTime)}</span>
                                <div
                                    className="mp3-bar-track"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const ratio = (e.clientX - rect.left) / rect.width;
                                        audioManager.seekPhone(ratio);
                                    }}
                                >
                                    <div
                                        className="mp3-bar-fill"
                                        style={{ width: `${audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}%` }}
                                    />
                                </div>
                                <span className="mp3-time">{formatTime(audioState.duration)}</span>
                            </div>

                            {/* Playback controls */}
                            <div className="mp3-controls" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    className="mp3-ctrl-btn"
                                    onClick={(e) => { e.stopPropagation(); audioManager.prevPhone(); }}
                                    title="Previous track"
                                >
                                    ⏮
                                </button>
                                <button
                                    type="button"
                                    className={`mp3-ctrl-btn mp3-play-btn ${audioState.phonePlaying ? 'is-playing' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); audioManager.togglePhone(); }}
                                    title={audioState.phonePlaying ? 'Pause' : 'Play'}
                                >
                                    {audioState.phonePlaying ? '⏸' : '▶'}
                                </button>
                                <button
                                    type="button"
                                    className="mp3-ctrl-btn"
                                    onClick={(e) => { e.stopPropagation(); audioManager.nextPhone(); }}
                                    title="Next track"
                                >
                                    ⏭
                                </button>
                                <button
                                    type="button"
                                    className="mp3-ctrl-btn mp3-vol-btn"
                                    onClick={(e) => { e.stopPropagation(); audioManager.toggleMute(); }}
                                    title={audioState.isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {audioState.isMuted ? '🔇' : '🔊'}
                                </button>
                            </div>

                            {/* Expandable playlist drawer */}
                            {showPlaylist && (
                                <div className="mp3-playlist-drawer" onClick={(e) => e.stopPropagation()}>
                                    <div className="mp3-drawer-head">
                                        <span>R2 Music Playlist</span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowPlaylist(false); }}>✕</button>
                                    </div>
                                    <div className="mp3-track-list">
                                        {audioState.playlist.map((track, idx) => (
                                            <button
                                                key={idx + track.file}
                                                type="button"
                                                className={`mp3-track-item ${idx === audioState.currentTrackIndex ? 'is-active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    audioManager.playPhone(idx);
                                                    setShowPlaylist(false);
                                                }}
                                            >
                                                <span className="track-idx">{idx + 1}</span>
                                                <span className="track-name">{track.title}</span>
                                                {idx === audioState.currentTrackIndex && audioState.phonePlaying && (
                                                    <span className="track-equalizer">▶</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <form
                                        className="mp3-custom-form"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (customFileName.trim()) {
                                                audioManager.addCustomTrack(customFileName.trim());
                                                setCustomFileName('');
                                                setShowPlaylist(false);
                                            }
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Play R2 file (e.g. track.mp3)"
                                            value={customFileName}
                                            onChange={(e) => setCustomFileName(e.target.value)}
                                            className="mp3-custom-input"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button type="submit" className="mp3-custom-btn" onClick={(e) => e.stopPropagation()}>Play</button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Home indicator bar (iPhone gesture line) */}
                        <div className="phone-home-indicator-wrap" onClick={toggle}>
                            <div className="phone-home-bar" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
