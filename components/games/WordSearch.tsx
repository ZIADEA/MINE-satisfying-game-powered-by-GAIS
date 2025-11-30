import React, { useState, useEffect, useRef } from 'react';
import { BaseGameProps, ThemeMode } from '../../types';
import { audioService } from '../../services/audioService';
import { ArrowLeft, Settings, RefreshCw } from 'lucide-react';

const WORDS = ['TYPESCRIPT', 'REACT', 'VARIABLE', 'FUNCTION', 'ARRAY', 'OBJECT', 'STRING', 'BOOLEAN', 'PROMISE', 'ASYNC'];
const GRID_SIZE = 12;

const THEMES = {
  black: { bg: 'bg-black', text: 'text-white', letter: 'text-gray-400', highlight: 'bg-green-500/30 text-green-300 shadow-[0_0_10px_rgba(0,255,0,0.5)]', found: 'text-green-500 line-through opacity-50' },
  white: { bg: 'bg-white', text: 'text-gray-900', letter: 'text-gray-800', highlight: 'bg-orange-500/30 text-orange-700', found: 'text-orange-500 line-through opacity-50' },
  dark:  { bg: 'bg-gray-900', text: 'text-gray-100', letter: 'text-gray-400', highlight: 'bg-pink-500/30 text-pink-300 shadow-[0_0_15px_rgba(255,0,200,0.3)]', found: 'text-pink-400 line-through opacity-50' },
};

type Coord = { r: number; c: number };

export const WordSearch: React.FC<BaseGameProps> = ({ onExit }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('ws_theme') as ThemeMode) || 'dark');
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selection, setSelection] = useState<{start: Coord, end: Coord} | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES[theme];

  useEffect(() => {
    localStorage.setItem('ws_theme', theme);
  }, [theme]);

  const generateGrid = () => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const placedWords: string[] = [];

    // Simple placement logic (horizontal/vertical only for stability in this demo)
    WORDS.forEach(word => {
      let placed = false;
      let attempts = 0;
      while(!placed && attempts < 100) {
        const dir = Math.random() > 0.5 ? 'H' : 'V';
        const r = Math.floor(Math.random() * (dir === 'H' ? GRID_SIZE : GRID_SIZE - word.length));
        const c = Math.floor(Math.random() * (dir === 'V' ? GRID_SIZE : GRID_SIZE - word.length));
        
        let canPlace = true;
        for(let i=0; i<word.length; i++) {
          const char = newGrid[dir === 'H' ? r : r+i][dir === 'V' ? c : c+i];
          if(char !== '' && char !== word[i]) canPlace = false;
        }

        if(canPlace) {
          for(let i=0; i<word.length; i++) {
            newGrid[dir === 'H' ? r : r+i][dir === 'V' ? c : c+i] = word[i];
          }
          placed = true;
          placedWords.push(word);
        }
        attempts++;
      }
    });

    // Fill empty
    for(let r=0; r<GRID_SIZE; r++) {
      for(let c=0; c<GRID_SIZE; c++) {
        if(newGrid[r][c] === '') {
          newGrid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }
    setGrid(newGrid);
    setFoundWords([]);
  };

  useEffect(() => {
    generateGrid();
  }, []);

  const getSelectedWord = (start: Coord, end: Coord) => {
    // Determine direction
    const dr = end.r - start.r;
    const dc = end.c - start.c;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    
    // Only allow straight lines
    if (steps === 0) return grid[start.r][start.c];
    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) return ''; // Not diagonal/straight

    const rStep = dr === 0 ? 0 : dr / steps;
    const cStep = dc === 0 ? 0 : dc / steps;

    let word = '';
    for(let i=0; i<=steps; i++) {
        word += grid[start.r + i*rStep][start.c + i*cStep];
    }
    return word;
  };

  const handlePointerDown = (r: number, c: number) => {
    setIsSelecting(true);
    setSelection({ start: {r,c}, end: {r,c} });
    audioService.play('click');
  };

  const handlePointerEnter = (r: number, c: number) => {
    if(isSelecting && selection) {
      setSelection({ ...selection, end: {r,c} });
    }
  };

  const handlePointerUp = () => {
    if(isSelecting && selection) {
      const word = getSelectedWord(selection.start, selection.end);
      const reversed = word.split('').reverse().join('');
      
      if(WORDS.includes(word) && !foundWords.includes(word)) {
        setFoundWords([...foundWords, word]);
        audioService.play('success');
      } else if (WORDS.includes(reversed) && !foundWords.includes(reversed)) {
        setFoundWords([...foundWords, reversed]);
        audioService.play('success');
      }
      
      setSelection(null);
      setIsSelecting(false);
    }
  };

  // Helper to check if a cell is selected visually
  const isCellSelected = (r: number, c: number) => {
    if(!selection) return false;
    const { start, end } = selection;
    const dr = end.r - start.r;
    const dc = end.c - start.c;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    
    if (steps === 0) return r === start.r && c === start.c;
    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;

    const rStep = dr === 0 ? 0 : dr / steps;
    const cStep = dc === 0 ? 0 : dc / steps;

    // Check if cell is on the line segment
    // Projected distance
    const distR = r - start.r;
    const distC = c - start.c;
    
    // It must be a multiple of the step
    const stepCountR = rStep !== 0 ? distR / rStep : 0;
    const stepCountC = cStep !== 0 ? distC / cStep : 0;
    
    // If we have movement in that axis, the step count must match
    const stepCount = (rStep !== 0) ? stepCountR : stepCountC;

    return stepCount >= 0 && stepCount <= steps && 
           Math.abs(start.r + stepCount * rStep - r) < 0.01 &&
           Math.abs(start.c + stepCount * cStep - c) < 0.01;
  };

  return (
    <div 
        className={`w-full h-full min-h-screen flex flex-col ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500`}
        onPointerUp={handlePointerUp}
    >
       <div className="p-4 flex justify-between items-center border-b border-white/10">
        <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft /></button>
        <h1 className="text-xl font-bold font-mono tracking-wider">WORD SEARCH</h1>
        <div className="flex gap-2">
            <button onClick={generateGrid} className="p-2 hover:bg-white/10 rounded-full"><RefreshCw size={20}/></button>
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

      <div className="flex flex-col md:flex-row flex-1 p-4 gap-8 justify-center items-center">
        {/* Grid */}
        <div 
          ref={gridRef}
          className="select-none touch-none bg-white/5 p-4 rounded-xl shadow-2xl"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: '4px' 
          }}
        >
          {grid.map((row, r) => (
             row.map((char, c) => (
               <div 
                 key={`${r}-${c}`}
                 className={`
                    w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-mono font-bold text-lg md:text-xl rounded transition-colors duration-200 cursor-pointer
                    ${isCellSelected(r, c) ? currentTheme.highlight : currentTheme.letter}
                 `}
                 onPointerDown={() => handlePointerDown(r, c)}
                 onPointerEnter={() => handlePointerEnter(r, c)}
               >
                 {char}
               </div>
             ))
          ))}
        </div>

        {/* Word List */}
        <div className={`p-6 rounded-xl w-full md:w-64 ${theme === 'white' ? 'bg-gray-100' : 'bg-white/5'}`}>
          <h3 className="font-bold mb-4 opacity-70 tracking-widest text-sm">TARGETS</h3>
          <div className="flex flex-wrap gap-2 md:flex-col">
            {WORDS.map(word => (
              <div key={word} className={`px-2 py-1 rounded text-sm font-semibold transition-all ${foundWords.includes(word) ? currentTheme.found : ''}`}>
                {word}
              </div>
            ))}
          </div>
          {foundWords.length === WORDS.length && (
             <div className="mt-8 text-center animate-bounce font-bold text-green-400">
               ALL WORDS FOUND!
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
