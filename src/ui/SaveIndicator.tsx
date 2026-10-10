/**
 * Save indicator.
 *
 * Wording is gated on WHO is looking:
 *   - a creator preview (no RUN host) may mention "preview" freely;
 *   - a published player must never see that word. If storage genuinely fails
 *     for them they get a plain, useful message instead.
 */
import { useEffect, useState } from 'react';
import { onSaveReport, saveReport, type SaveReport } from '../state/gameState.ts';

export default function SaveIndicator() {
    const [report, setReport] = useState<SaveReport>(saveReport());
    const [flash, setFlash] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const off = onSaveReport((next) => {
            setReport(next);
            if (next.status === 'saved') {
                setFlash(true);
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => setFlash(false), 1500);
            }
        });
        return () => {
            off();
            if (timer) clearTimeout(timer);
        };
    }, []);

    // Progress is not durable. Two very different audiences, two messages.
    if (!report.durable && !dismissed) {
        return (
            <button type="button" className="save-chip preview" onClick={() => setDismissed(true)}>
                <span className="save-row">
                    <span className="save-dot" />
                    {report.preview ? 'Preview: progress lasts this session' : 'Progress may not be saved'}
                </span>
                <span className="save-why">
                    {report.note ?? 'Reopening the game usually fixes it.'} Tap to dismiss.
                </span>
            </button>
        );
    }

    // A genuine write failure while storage was expected to work.
    if (report.status === 'failed') {
        return (
            <div className="save-chip failed" role="status">
                <span className="save-row"><span className="save-dot" />Progress not saving</span>
                <span className="save-why">
                    {report.preview ? report.error : 'Reopening the game usually fixes it.'}
                </span>
            </div>
        );
    }

    if (!flash && report.status !== 'saving') return null;

    return (
        <div className={'save-chip ' + report.status} role="status">
            <span className="save-row">
                <span className="save-dot" />
                {report.status === 'saving' ? 'Saving…' : 'Progress saved'}
            </span>
        </div>
    );
}
