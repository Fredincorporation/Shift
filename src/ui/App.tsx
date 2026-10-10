import { useStore } from '../state/store.ts';
import LoadingScreen from './LoadingScreen.tsx';
import MainMenu from './MainMenu.tsx';
import GameView from './GameView.tsx';

export default function App() {
    const phase = useStore((s) => s.phase);
    return (
        <div id="app-frame">
            {phase === 'loading' && <LoadingScreen />}
            {phase === 'menu' && <MainMenu />}
            {phase === 'playing' && <GameView />}
        </div>
    );
}
