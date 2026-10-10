import { useStore } from '../state/store.ts';

export default function LoadingScreen() {
    const progress = useStore((s) => s.loadProgress);
    const pct = Math.round(progress * 100);
    return (
        <div className="loading-screen">
            <p className="menu-eyebrow">Northlight Interactive</p>
            <h2 className="loading-title">SHIFT</h2>
            <div className="loading-track"><span style={{ width: pct + '%' }} /></div>
            <p className="loading-note">Building the studio&hellip; {pct}%</p>
        </div>
    );
}
