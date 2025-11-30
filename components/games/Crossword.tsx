import React, { useState, useEffect, useRef } from 'react';
import { BaseGameProps, ThemeMode } from '../../types';
import { audioService } from '../../services/audioService';
import { ArrowLeft, Check, Lightbulb, Settings, RotateCcw } from 'lucide-react';

const PUZZLE_DATA = {
  grid: [
    ['R', 'E', 'A', 'C', 'T', '#', 'W', 'E', 'B', '#', 'A', 'P', 'P'],
    ['O', '#', 'P', '#', 'Y', '#', 'I', '#', 'U', '#', 'P', '#', 'O'],
    ['O', 'D', 'E', '#', 'P', 'I', 'N', 'G', '#', 'C', 'I', 'T', 'Y'],
    ['T', '#', '#', '#', 'E', '#', 'D', '#', '#', '#', '#', '#', 'L'],
    ['#', 'C', 'O', 'D', 'E', '#', 'O', 'R', 'B', 'I', 'T', '#', '#'],
    ['J', '#', '#', '#', '#', '#', 'W', '#', '#', '#', 'H', '#', 'S'],
    ['A', 'R', 'R', 'A', 'Y', '#', '#', '#', 'D', 'A', 'T', 'A', '#'],
    ['V', '#', '#', '#', '#', '#', 'G', '#', '#', '#', '#', '#', 'T'],
    ['A', '#', 'S', 'T', 'A', 'C', 'K', '#', 'N', 'O', 'D', 'E', 'S'],
    ['#', '#', 'Q', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
  ],
  clues: {
    across: [
      { num: 1, text: 'Popular JS library by Meta' },
      { num: 4, text: 'World Wide ___' },
      { num: 6, text: 'Small software application' },
      { num: 8, text: 'Network latency test' },
      { num: 10, text: 'Large urban area' },
      { num: 11, text: 'Program instructions' },
      { num: 13, text: 'Curved path around a planet' },
      { num: 15, text: 'Data structure collection' },
      { num: 17, text: 'Information values' },
      { num: 19, text: 'LIFO structure' },
      { num: 21, text: 'Graph elements' },
    ],
    down: [
      { num: 1, text: 'Plant anchor' },
      { num: 2, text: 'Primates' },
      { num: 3, text: 'Variable categorization' },
      { num: 5, text: 'Direction of sunrise' },
      { num: 7, text: 'Application Interface (abbr)' },
      { num: 9, text: 'Polite title for a lady' },
      { num: 12, text: 'Coffee slang or language' },
      { num: 14, text: 'The "T" in HTML' },
      { num: 16, text: 'Structured Query Language' },
      { num: 18, text: 'Insect related to code errors' },
      { num: 20, text: 'Standard Time (abbr)' },
    ]
  }
};

const THEMES = {
  black: { bg: 'bg-black', text: 'text-white', cell: 'bg-gray-900 border-gray-700', active: 'bg-yellow-900', accent: 'text-yellow-400', grid: 'border-gray-800' },
  white: { bg: 'bg-white', text: 'text-gray-900', cell: 'bg-white border-gray-300', active: 'bg-blue-100', accent: 'text-blue-600', grid: 'border-gray-200' },
  dark: { bg: 'bg-slate-800', text: 'text-slate-100', cell: 'bg-slate-700 border-slate-600', active: 'bg-teal-900', accent: 'text-teal-400', grid: 'border-slate-600' },
};

export const Crossword: React.FC<BaseGameProps> = ({ onExit }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('cw_theme') as ThemeMode) || 'black');
  const [grid, setGrid] = useState<string[][]>(() => {
    const saved = localStorage.getItem('cw_progress');
    return saved ? JSON.parse(saved) : Array(10).fill(Array(13).fill(''));
  });
  const [activeCell, setActiveCell] = useState<{r: number, c: number} | null>(null);
  
  const currentTheme = THEMES[theme];

  useEffect(() => {
    localStorage.setItem('cw_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cw_progress', JSON.stringify(grid));
  }, [grid]);

  const handleCellChange = (r: number, c: number, val: string) => {
    if (PUZZLE_DATA.grid[r][c] === '#') return;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = val.toUpperCase();
    setGrid(newGrid);
    audioService.play('click');
  };

  const checkAnswers = () => {
    let correct = true;
    for(let r=0; r<10; r++) {
      for(let c=0; c<13; c++) {
        if(PUZZLE_DATA.grid[r][c] !== '#' && grid[r][c] !== PUZZLE_DATA.grid[r][c]) {
          correct = false;
        }
      }
    }
    if(correct) audioService.play('success');
    else audioService.play('fail');
    alert(correct ? "Puzzle Complete!" : "Keep trying!");
  };

  const resetGame = () => {
     if(confirm("Reset puzzle?")) {
        setGrid(Array(10).fill(Array(13).fill('')));
     }
  };

  return (
    <div className={`w-full h-full min-h-screen flex flex-col ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500 overflow-y-auto`}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft /></button>
        <h1 className="text-xl font-bold font-mono tracking-wider">CROSSWORD</h1>
        <div className="flex gap-2">
            <button onClick={resetGame} className="p-2 hover:bg-white/10 rounded-full"><RotateCcw size={20}/></button>
            <div className="relative group">
                <button className="p-2 hover:bg-white/10 rounded-full"><Settings size={20}/></button>
                <div className="absolute right-0 top-full mt-2 bg-gray-800 p-2 rounded shadow-xl hidden group-hover:flex flex-col gap-2 z-50 min-w-[120px]">
                    <span className="text-xs text-gray-400 px-2">THEME</span>
                    {(['black', 'white', 'dark'] as ThemeMode[]).map(t => (
                        <button key={t} onClick={() => setTheme(t)} className="text-left px-2 py-1 text-sm hover:bg-gray-700 capitalize rounded text-white">
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 p-4 lg:p-8 gap-8 max-w-7xl mx-auto w-full">
        {/* Grid Area */}
        <div className="flex-1 flex justify-center items-start overflow-auto">
          <div className={`grid gap-[1px] bg-gray-500 p-[1px] shadow-2xl`} 
               style={{ gridTemplateColumns: `repeat(13, minmax(20px, 40px))` }}>
            {PUZZLE_DATA.grid.map((row, r) => (
              row.map((cell, c) => {
                const isBlack = cell === '#';
                const isActive = activeCell?.r === r && activeCell?.c === c;
                return (
                  <div key={`${r}-${c}`} className={`aspect-square relative ${isBlack ? 'bg-black' : currentTheme.cell}`}>
                    {!isBlack && (
                      <input 
                        type="text" 
                        maxLength={1}
                        className={`w-full h-full text-center font-bold bg-transparent outline-none uppercase ${isActive ? currentTheme.active : ''}`}
                        value={grid[r] && grid[r][c] ? grid[r][c] : ''}
                        onFocus={() => setActiveCell({r, c})}
                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                      />
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        {/* Clues Area */}
        <div className="lg:w-80 flex flex-col gap-6">
          <div className={`p-4 rounded-xl ${theme === 'white' ? 'bg-gray-100' : 'bg-white/5'} flex-1`}>
            <h3 className={`font-bold mb-2 ${currentTheme.accent}`}>ACROSS</h3>
            <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
              {PUZZLE_DATA.clues.across.map(clue => (
                <li key={`a-${clue.num}`}><span className="font-bold opacity-60">{clue.num}.</span> {clue.text}</li>
              ))}
            </ul>
          </div>
          <div className={`p-4 rounded-xl ${theme === 'white' ? 'bg-gray-100' : 'bg-white/5'} flex-1`}>
            <h3 className={`font-bold mb-2 ${currentTheme.accent}`}>DOWN</h3>
             <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
              {PUZZLE_DATA.clues.down.map(clue => (
                <li key={`d-${clue.num}`}><span className="font-bold opacity-60">{clue.num}.</span> {clue.text}</li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={checkAnswers}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${theme === 'white' ? 'bg-blue-600 text-white' : 'bg-white text-black'} hover:opacity-90 transition`}
          >
            <Check size={18} /> CHECK PUZZLE
          </button>
        </div>
      </div>
    </div>
  );
};
