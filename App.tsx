import React, { useState } from 'react';
import { GameType } from './types';
import { Crossword } from './components/games/Crossword';
import { WordSearch } from './components/games/WordSearch';
import { Clicker } from './components/games/Clicker';
import { Labyrinth } from './components/games/Labyrinth';
import { Runner } from './components/games/Runner';
import { Gamepad2, Grid3X3, MousePointer2, Box, Footprints } from 'lucide-react';

const MENU_ITEMS = [
  { id: GameType.CROSSWORD, title: 'Crossword', desc: 'Solve classic puzzles', icon: Grid3X3, color: 'bg-blue-500' },
  { id: GameType.WORD_SEARCH, title: 'Word Search', desc: 'Find hidden words', icon: Gamepad2, color: 'bg-green-500' },
  { id: GameType.CLICKER, title: 'Zen Clicker', desc: 'Satisfying idle game', icon: MousePointer2, color: 'bg-purple-500' },
  { id: GameType.LABYRINTH, title: '3D Labyrinth', desc: 'Find the exit', icon: Box, color: 'bg-orange-500' },
  { id: GameType.RUNNER, title: 'Temple Run', desc: 'Endless runner', icon: Footprints, color: 'bg-red-500' },
];

function App() {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.MENU);

  const renderGame = () => {
    switch (activeGame) {
      case GameType.CROSSWORD: return <Crossword onExit={() => setActiveGame(GameType.MENU)} />;
      case GameType.WORD_SEARCH: return <WordSearch onExit={() => setActiveGame(GameType.MENU)} />;
      case GameType.CLICKER: return <Clicker onExit={() => setActiveGame(GameType.MENU)} />;
      case GameType.LABYRINTH: return <Labyrinth onExit={() => setActiveGame(GameType.MENU)} />;
      case GameType.RUNNER: return <Runner onExit={() => setActiveGame(GameType.MENU)} />;
      default: return null;
    }
  };

  if (activeGame !== GameType.MENU) {
    return (
      <div className="w-full h-screen overflow-hidden animate-in fade-in duration-300">
        {renderGame()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow" />
       
       <header className="mb-12 text-center z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            OMNI 5
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            A premium collection of arcade classics and 3D experiences.
          </p>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full z-10">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveGame(item.id)}
              className="group relative bg-gray-800/50 hover:bg-gray-800 border border-white/5 hover:border-white/20 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm overflow-hidden"
            >
               <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <item.icon size={120} />
               </div>
               
               <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:rotate-6 transition-transform`}>
                  <item.icon className="text-white" size={24} />
               </div>
               
               <h3 className="text-2xl font-bold mb-1">{item.title}</h3>
               <p className="text-gray-400 text-sm">{item.desc}</p>
            </button>
          ))}
       </div>

       <footer className="mt-16 text-gray-600 text-sm z-10">
          v1.0.0 • React • Three.js • Tailwind
       </footer>
    </div>
  );
}

export default App;