/**
 * Travel sheet: the places the story has opened up, and where you can go now.
 *
 * The list is built from the LOCATIONS registry rather than a hand-written array,
 * so a location added to the story can never be missing here — which is exactly
 * what happened to the roof and the clinic.
 */
import { store, useStore } from '../state/store.ts';
import { LOCATIONS, type SceneId } from '../world/anchors.ts';
import { travelOptions, travelTo, track } from '../story/runtime.ts';

/**
 * Display order. Every id in LOCATIONS is shown; this only decides the sequence,
 * and anything not listed falls in at the end automatically.
 */
const PREFERRED: SceneId[] = ['studio', 'rooftop', 'home', 'bar', 'family', 'publisher', 'clinic'];

const ALL_IDS = Object.keys(LOCATIONS) as SceneId[];
const ORDER: SceneId[] = [
    ...PREFERRED.filter((id) => ALL_IDS.includes(id)),
    ...ALL_IDS.filter((id) => !PREFERRED.includes(id)),
];

export default function TravelSheet() {
    const open = useStore((s) => s.travelOpen);
    const game = useStore((s) => s.game);
    if (!open) return null;

    const available = travelOptions(game).map((l) => l.id);
    const close = () => store.patch({ travelOpen: false });

    // Count only real, known locations, so the total can never be exceeded.
    const foundCount = ORDER.filter((id) => game.unlocked.includes(id)).length;

    return (
        <div className="travel-layer" onClick={close}>
            <div className="travel-body" onClick={(e) => e.stopPropagation()}>
                <p className="travel-title">Where to?</p>
                <p className="travel-sub">
                    {foundCount} of {ORDER.length} places found
                </p>

                <div className="travel-list">
                    {ORDER.map((id) => {
                        const loc = LOCATIONS[id];
                        const found = game.unlocked.includes(id);
                        const here = game.scene === id;
                        const canGo = available.includes(id) && !here;
                        return (
                            <button
                                key={id}
                                type="button"
                                className={
                                    'travel-row' + (here ? ' here' : '') + (!found ? ' locked' : canGo ? '' : ' shut')
                                }
                                disabled={!canGo}
                                onClick={() => {
                                    travelTo(id);
                                    track('travel_selected', { to: id, beat: game.beat });
                                }}
                            >
                                <span className="travel-dot" />
                                <span className="travel-info">
                                    <span className="travel-name">{found ? loc.name : 'Not discovered yet'}</span>
                                    <span className="travel-note">
                                        {!found
                                            ? 'The story will take you here'
                                            : here
                                                ? 'You are here'
                                                : canGo
                                                    ? loc.subtitle
                                                    : 'Not right now'}
                                    </span>
                                </span>
                                {canGo && <span className="travel-go">Go</span>}
                            </button>
                        );
                    })}
                </div>

                <button type="button" className="travel-close" onClick={close}>Close</button>
            </div>
        </div>
    );
}
