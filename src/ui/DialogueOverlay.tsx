/**
 * Cinematic dialogue overlay: glassmorphism panel, character portrait, a
 * typewriter effect, and multi-choice response buttons sized for thumbs.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.ts';
import { NODES } from '../story/story.ts';
import { advance, markLineDone, pickChoice } from '../story/runtime.ts';

const PORTRAITS: Record<string, { initial: string; tint: string }> = {
    player: { initial: 'YOU', tint: '#4b7f9d' },
    mara: { initial: 'M', tint: '#a8535d' },
    jonah: { initial: 'J', tint: '#6d8058' },
    theo: { initial: 'T', tint: '#c9a24a' },
    family: { initial: '\u2665', tint: '#c76b8a' },
    friend: { initial: 'P', tint: '#6f7fc0' },
    sister: { initial: 'I', tint: '#5f9a8a' },
    exec: { initial: 'H', tint: '#5a6a8f' },
    nadia: { initial: 'N', tint: '#38a3a5' },
    priya: { initial: 'P', tint: '#6f7fc0' },
    tara: { initial: 'TP', tint: '#b56576' },
    narration: { initial: '\u25C7', tint: '#5b6478' },
};

export default function DialogueOverlay() {
    const dialogue = useStore((s) => s.dialogue);
    const [shown, setShown] = useState('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const node = dialogue ? NODES[dialogue.nodeId] : null;
    const line = node?.lines[dialogue?.lineIndex ?? 0] ?? null;
    const full = line?.text ?? '';
    const isDone = dialogue?.lineDone ?? false;

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!line) { setShown(''); return; }
        if (isDone) { setShown(full); return; }
        setShown('');
        let i = 0;
        timerRef.current = setInterval(() => {
            i += 1;
            setShown(full.slice(0, i));
            if (i >= full.length) {
                if (timerRef.current) clearInterval(timerRef.current);
                markLineDone();
            }
        }, 18);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [full, isDone, line]);

    if (!dialogue || !node || !line) return null;

    // A couple of speakers share a 'who' slot; the name picks the right face.
    const OVERRIDES: Record<string, { initial: string; tint: string }> = {
        'Dr Adeyemi': { initial: 'Rx', tint: '#5f9a8a' },
        Priya: { initial: 'P', tint: '#6f7fc0' },
        Iris: { initial: 'I', tint: '#5f9a8a' },
    };
    const portrait = OVERRIDES[line.speaker] ?? PORTRAITS[line.who] ?? PORTRAITS.narration;
    const atLastLine = dialogue.lineIndex === node.lines.length - 1;
    const showChoices = atLastLine && isDone && !!node.choices?.length;

    return (
        <div className="dialogue-layer" onClick={() => { if (!showChoices) advance(); }}>
            <div className="dialogue-panel">
                <div className="dialogue-head">
                    <div className="portrait" style={{ background: portrait.tint }}>{portrait.initial}</div>
                    <div className="speaker-block">
                        <span className="speaker-name">{line.speaker}</span>
                        {line.who === 'narration' && <span className="speaker-role">scene</span>}
                    </div>
                </div>
                <p className={line.who === 'narration' ? 'dialogue-text narration' : 'dialogue-text'}>{shown}</p>
                {!showChoices && (
                    <div className="advance-hint">{isDone ? 'Tap to continue \u203A' : 'Tap to skip'}</div>
                )}
                {showChoices && (
                    <div className="choice-list">
                        {node.choices!.map((choice, index) => (
                            <button
                                key={choice.text}
                                type="button"
                                className="choice-button"
                                onClick={(e) => { e.stopPropagation(); pickChoice(index); }}
                            >
                                <span className="choice-text">{choice.text}</span>
                                {choice.hint && <span className="choice-hint">{choice.hint}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
