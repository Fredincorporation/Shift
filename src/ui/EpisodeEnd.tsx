/**
 * Episode-end screen: what your choices added up to, the threads Episode 2 will
 * pick up, and a way back into the world to wander.
 */
import { store, useStore } from '../state/store.ts';
import { freshState, clearState } from '../state/gameState.ts';
import { locationName, persist, track } from '../story/runtime.ts';
import type { SceneId } from '../world/anchors.ts';

function Bar({ label, value, tint, icon, inverse }: { label: string; value: number; tint: string; icon?: string; inverse?: boolean }) {
    const level = inverse ? 100 - value : value;
    const mood = level > 66 ? 'good' : level > 33 ? 'mid' : 'bad';
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    return (
        <div className="ep-meter-row">
            <div className="ep-meter-label-wrap">
                {icon && <span className="ep-meter-icon">{icon}</span>}
                <span className="ep-meter-label">{label}</span>
            </div>
            <div className="ep-meter-bar-track">
                <div
                    className="ep-meter-bar-fill"
                    style={{
                        width: `${clamped}%`,
                        background: `linear-gradient(90deg, ${tint}bb, ${tint})`,
                        boxShadow: `0 0 10px ${tint}77`,
                    }}
                >
                    <span className="ep-meter-bar-glint" />
                </div>
            </div>
            <div className="ep-meter-val-wrap">
                <span className={`meter-value ${mood}`}>{clamped}</span>
            </div>
        </div>
    );
}

export default function EpisodeEnd() {
    const game = useStore((s) => s.game);
    const seeds = game.legacy_seeds;
    const epNum =
        game.beat === 'ep7_epilogue' ? 7 :
            game.beat === 'ep6_epilogue' ? 6 :
                game.beat === 'ep5_epilogue' ? 5 :
                    game.beat === 'ep4_epilogue' ? 4 :
                        game.beat === 'ep3_epilogue' ? 3 :
                            game.beat === 'ep2_epilogue' ? 2 : 1;

    // Threads written from what actually happened, per episode.
    const threads: string[] = [];
    if (epNum === 7) {
        if (seeds.founded_worker_coop) threads.push('You founded an independent worker-owned co-op with Jonah, Theo, Nadia, and Priya.');
        if (seeds.stayed_vantage_director) threads.push('You became Studio Director of Northlight, stepping up into executive leadership.');
        if (seeds.walked_away_clean) threads.push('You walked away clean from the games industry to build with your dad and live peacefully.');
        if (seeds.dad_recovered_proud) threads.push('Your dad is healthy and smiling, proud of the person you chose to be.');
        if (seeds.unlocked_coop_timeline) threads.push('You unlocked the secret Co-operative Timeline from the rooftop charter.');
        if (seeds.unlocked_indie_timeline) threads.push('You exposed publisher crunch and unlocked the Indie Renaissance Timeline.');
        if (game.burnout <= 25) threads.push('You finished your journey rested and whole.');
        if (game.family_bond >= 80) threads.push('Your bond with family survived the pressures of production.');
    } else if (epNum === 6) {
        if (seeds.pushed_launch_back) threads.push('You delayed submission two weeks to fix the audio memory leak. Quality came first.');
        if (seeds.certified_flawed_build) threads.push('You certified a flawed build to preserve the street date, banking on a day-zero patch.');
        if (seeds.family_attended_launch) threads.push('Your dad cheered for your launch with your newspaper advert on the fridge.');
        if (threads.length === 0) threads.push('Your game shipped into the world to critical acclaim.');
    } else if (epNum === 5) {
        if (seeds.pulled_all_nighter_solo) threads.push('You stayed up all night to reconstruct corrupted asset branches by hand.');
        if (seeds.whistleblower_emailed) threads.push('You preserved the paper trail proving Vantage stripped server backup redundancy.');
        if (seeds.erased_crunch_records) threads.push('You buried the email dispute to protect Northlight from legal repercussions.');
        if (seeds.held_the_line) threads.push('You looked Halvard in the eye and defended the recovered milestone.');
    } else if (epNum === 4) {
        if (seeds.stood_up_to_tara) threads.push('You refused Tara\'s demands to gut Nadia\'s puzzle rooms.');
        if (seeds.allied_with_tara) threads.push('You found common ground with Tara and understood the developer beneath the suit.');
        if (seeds.sheltered_nadia_from_audit) threads.push('You shielded Nadia from corporate scrutiny, taking the heat yourself.');
    } else if (epNum === 3) {
        if (seeds.took_the_lead) threads.push('You accepted the Act 2 lead and stood as a shield for Nadia.');
        if (seeds.refused_lead) threads.push('You refused the lead and pushed for Theo to get his deserved promotion.');
        if (seeds.was_at_the_ward) threads.push('You went to St Bride\'s Ward 6 to be with your dad when it mattered.');
        if (seeds.told_mara_about_dad) threads.push('You were honest with Mara about your dad\'s health.');
        if (seeds.held_the_line) threads.push('You refused to give Halvard a scapegoat for the studio slip.');
    } else if (epNum === 2) {
        if (seeds.cut_scope) threads.push('You cut the third act to save the team. The game is smaller and still standing.');
        if (seeds.crunched_team) threads.push('You spent six weekends of other people\'s lives. They know exactly who agreed to it.');
        if (seeds.asked_for_time) threads.push('You made Mara ask upward. Halvard now knows this studio will say no.');
        if (seeds.took_theo_to_clinic) threads.push('You walked Theo to a clinic. He went back on his own the week after.');
        if (seeds.pushed_theo) threads.push('You sent Theo back to the desk. He has not looked at you the same since.');
        if (seeds.told_theo_himself) threads.push('You carried Mara\'s bad news yourself. She noticed what that cost.');
        if (seeds.refused_mara) threads.push('You refused to deliver her bad news. It was fair, and it left a mark.');
        if (seeds.gave_slot_away) threads.push('You gave your own appointment away. Nobody has booked you another.');
        if (seeds.was_honest_doctor) threads.push('A doctor has it in writing now. That is harder to ignore than a feeling.');
        if (seeds.held_the_line) threads.push('You refused a date you could not hold. Nine months of production start honest.');
        if (game.burnout >= 70) threads.push('You go into full production already empty.');
        if (game.burnout <= 30) threads.push('Somehow you came out of crunch intact. That is the rarest ending here.');
        if (game.family_bond <= 40) threads.push('Your dad had a scan and you were not there for the telling of it.');
        if (game.family_bond >= 80) threads.push('Your family got the version of you they actually wanted.');
        if (game.friend_closeness <= 35) threads.push('Priya has stopped keeping the seat.');
        if (threads.length === 0) threads.push('You held everything level through crunch, which almost nobody manages.');
    } else {
        if (seeds.protected_theo) threads.push('Theo owes you, and Mara half-knows you covered for him.');
        if (seeds.blamed_theo) threads.push('Theo took it alone. Jonah has not forgotten that you watched.');
        if (seeds.middle_path) threads.push('You made Theo own his mistake and stood beside him. Both of them noticed.');
        if (seeds.worked_weekend) threads.push('You proved you will stay up. People will ask again.');
        if (seeds.closed_laptop) threads.push('You closed the laptop once. Mara is still deciding what that means.');
        if (seeds.spoke_for_team) threads.push('You told a publisher your team was exhausted. That travels.');
        if (seeds.chose_family) threads.push('You promised your family in pen. The slice is due the same month.');
        if (seeds.phone_in_drawer) threads.push('Your phone went in the drawer at dinner. Your mum tells everyone.');
        if (game.burnout >= 70) threads.push('You are running on nothing, and the slice is six weeks out.');
        if (game.burnout <= 30) threads.push('You are somehow still rested. Nobody at Northlight understands how.');
        if (game.friend_closeness <= 35) threads.push('Priya has stopped suggesting Fridays.');
        if (threads.length === 0) threads.push('You kept everything level. Episode 2 will test whether that holds.');
    }

    const wander = () => {
        track('episode_wander_selected', { beat: game.beat });
        store.patch({ episodeEndOpen: false });
    };

    const replay = () => {
        const clean = freshState();
        void clearState();
        store.patch({
            game: clean, dialogue: null, unread: 0, hasSave: true,
            phoneOpen: false, travelOpen: false, episodeEndOpen: false, walking: false,
        });
        persist(clean);
        track('episode_replayed');
        store.patch({ phase: 'playing' });
    };

    const kicker =
        epNum === 7 ? 'Shift — Complete Journey' :
            epNum === 6 ? 'Episode 6 complete' :
                epNum === 5 ? 'Episode 5 complete' :
                    epNum === 4 ? 'Episode 4 complete' :
                        epNum === 3 ? 'Episode 3 complete' :
                            epNum === 2 ? 'Episode 2 complete' : 'Episode 1 complete';

    const subtitle =
        epNum === 7 ? 'Two years of choices across seven episodes. Here is who you became.' :
            epNum === 6 ? 'Gold Master certification and launch night. The world has your game now.' :
                epNum === 5 ? 'A server blackout and a publisher paper trail. Here is what survived.' :
                    epNum === 4 ? 'An embedded producer and an efficiency audit. Here is what held.' :
                        epNum === 3 ? 'You were the person in charge. You balanced the team and Ward 6.' :
                            epNum === 2 ? 'Six weeks of crunch and a slice that held. Here is what it cost.' :
                                'Two weeks at Northlight. Here is what it cost.';

    return (
        <div className="ep-layer">
            <div className="ep-body">
                <p className="ep-kicker">{kicker}</p>
                <h2 className="ep-title">Shift</h2>
                <p className="ep-sub">{subtitle}</p>

                <div className="ep-meters">
                    <Bar label="Burnout" value={game.burnout} tint="#e2703f" icon="🔥" inverse />
                    <Bar label="Mara" value={game.mara_trust} tint="#5aa9d6" icon="💼" />
                    <Bar label="Jonah" value={game.jonah_closeness} tint="#7fa86a" icon="📐" />
                    <Bar label="Theo" value={game.theo_trust} tint="#d6b45a" icon="🎨" />
                    {epNum >= 3 && <Bar label="Nadia" value={game.nadia_trust} tint="#38a3a5" icon="✨" />}
                    <Bar label="Family" value={game.family_bond} tint="#d47b9a" icon="🏡" />
                    <Bar label="Friends" value={game.friend_closeness} tint="#8b86d6" icon="🍻" />
                </div>

                <p className="ep-section">{epNum === 7 ? 'Your Definitive Legacy' : 'What you carry forward'}</p>
                <ul className="ep-threads">
                    {threads.map((thread) => <li key={thread}>{thread}</li>)}
                </ul>

                <p className="ep-section">Places you found</p>
                <p className="ep-places">
                    {game.unlocked.map((id) => locationName(id as SceneId)).join(' · ')}
                </p>

                <div className="ep-next">
                    {epNum === 7 ? (
                        <>
                            <p className="ep-next-title">The Horizon Has Arrived</p>
                            <p className="ep-next-body">
                                You have completed all seven episodes of Shift. Every room in your life is open for free roaming.
                            </p>
                        </>
                    ) : epNum === 6 ? (
                        <>
                            <p className="ep-next-title">Episode 7 — &ldquo;The Horizon&rdquo; (Series Finale)</p>
                            <p className="ep-next-body">
                                Two months post-launch. Awards, Halvard\'s final contract offer, and the ultimate choice of who you will be. Sleep at your apartment to begin the finale.
                            </p>
                        </>
                    ) : epNum === 5 ? (
                        <>
                            <p className="ep-next-title">Episode 6 — &ldquo;The Gold Master&rdquo;</p>
                            <p className="ep-next-body">
                                Submission deadline week. A critical memory leak, console certification, and launch night at the Lamplighter. Sleep at your apartment to begin it.
                            </p>
                        </>
                    ) : epNum === 4 ? (
                        <>
                            <p className="ep-next-title">Episode 5 — &ldquo;The Blackout&rdquo;</p>
                            <p className="ep-next-body">
                                2:00 AM server crash. Eighteen thousand lines of merge conflicts, a paper trail against Vantage, and Dad\'s recovery. Sleep to begin it.
                            </p>
                        </>
                    ) : epNum === 3 ? (
                        <>
                            <p className="ep-next-title">Episode 4 — &ldquo;The Embedded Producer&rdquo;</p>
                            <p className="ep-next-body">
                                Tara Patel arrives from Vantage. Efficiency audits, velocity charts, and Friday drinks with Priya. Sleep at your apartment to begin it.
                            </p>
                        </>
                    ) : epNum === 2 ? (
                        <>
                            <p className="ep-next-title">Episode 3 — &ldquo;The Person in Charge&rdquo;</p>
                            <p className="ep-next-body">
                                You lead Act 2 now. Nadia reports to you, Jonah has an offer, and Dad is in Ward 6. Sleep at your apartment to begin it.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="ep-next-title">Episode 2 — &ldquo;The Slice&rdquo;</p>
                            <p className="ep-next-body">
                                Thirty-four days to a vertical slice. Theo is not sleeping, Jonah has
                                nursery pickup, and your family is still waiting. Sleep at your
                                apartment to begin it.
                            </p>
                        </>
                    )}
                </div>

                <div className="ep-actions">
                    <button type="button" className="btn-primary" onClick={wander}>
                        {epNum === 7 ? 'Wander all rooms' : `Continue — sleep to begin Episode ${epNum + 1}`}
                    </button>
                    <button type="button" className="btn-ghost" onClick={replay}>
                        Start again from Episode 1
                    </button>
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => { track('episode_menu_selected'); store.patch({ episodeEndOpen: false, phase: 'menu' }); }}
                    >
                        Main menu
                    </button>
                </div>
            </div>
        </div>
    );
}
