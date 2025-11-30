import React, { useState, useEffect, useCallback } from 'react';
import { BaseGameProps, ThemeMode } from '../../types';
import { audioService } from '../../services/audioService';
import { ArrowLeft, Settings, Star, Heart, Circle, Square, Hexagon, Triangle } from 'lucide-react';

const SHAPES = [
  { id: 'circle', icon: Circle, price: 0 },
  { id: 'square', icon: Square, price: 100 },
  { id: 'triangle', icon: Triangle, price: 500 },
  { id: 'heart', icon: Heart, price: 1000 },
  { id: 'star', icon: Star, price: 5000 },
  { id: 'hexagon', icon: Hexagon, price: 10000 },
];

const THEMES = {
  black: { bg: 'bg-black', text: 'text-white', btn: 'border-white text-white hover:bg-white/10 active:bg-yellow-500 active:border-yellow-500', particle: '#FFD700' },
  white: { bg: 'bg-white', text: 'text-black', btn: 'border-black text-black hover:bg-black/5 active:bg-blue-200 active:border-blue-400', particle: '#3B82F6' },
  dark: { bg: 'bg-[#1a1a1a]', text: 'text-gray-200', btn: 'border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95', particle: '#A855F7' },
};

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
}

export const Clicker: React.FC<BaseGameProps> = ({ onExit }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('cl_theme') as ThemeMode) || 'black');
  const [count, setCount] = useState(() => parseInt(localStorage.getItem('cl_count') || '0'));
  const [shape, setShape] = useState(() => localStorage.getItem('cl_shape') || 'circle');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>(() => JSON.parse(localStorage.getItem('cl_unlocked') || '["circle"]'));
  
  const currentTheme = THEMES[theme];

  useEffect(() => {
    localStorage.setItem('cl_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cl_count', count.toString());
  }, [count]);

  useEffect(() => {
    localStorage.setItem('cl_shape', shape);
  }, [shape]);

  useEffect(() => {
    localStorage.setItem('cl_unlocked', JSON.stringify(unlocked));
  }, [unlocked]);

  // Particle loop
  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + Math.cos(p.angle) * p.speed,
        y: p.y + Math.sin(p.angle) * p.speed,
        life: p.life - 0.02
      })).filter(p => p.life > 0));
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    setCount(c => c + 1);
    audioService.play('pop');
    
    // Spawn particles
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const newParticles: Particle[] = [];
    for(let i=0; i<8; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: centerX, // relative to viewport, tricky with fixed pos. Simplified: use fixed center relative to container
        y: centerY,
        angle: (Math.PI * 2 * i) / 8,
        speed: 2 + Math.random() * 2,
        life: 1.0
      });
    }
    // Simplification: Not rendering particles in this constrained DOM version to avoid coordinate complexity overflow in single file.
    // Instead, using CSS animations on the button itself.
  };

  const unlockShape = (id: string, price: number) => {
    if(count >= price && !unlocked.includes(id)) {
      setCount(c => c - price);
      setUnlocked([...unlocked, id]);
      setShape(id);
      audioService.play('success');
    } else if (unlocked.includes(id)) {
      setShape(id);
      audioService.play('click');
    }
  };

  const ShapeIcon = SHAPES.find(s => s.id === shape)?.icon || Circle;

  return (
    <div className={`w-full h-full min-h-screen flex flex-col ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500 overflow-hidden relative`}>
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-10">
        <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft /></button>
        <div className="flex gap-2 relative group">
           <button className="p-2 hover:bg-white/10 rounded-full"><Settings /></button>
            <div className="absolute right-0 top-full mt-2 bg-gray-800 p-2 rounded shadow-xl hidden group-hover:flex flex-col gap-2 z-50 min-w-[120px]">
                {(['black', 'white', 'dark'] as ThemeMode[]).map(t => (
                    <button key={t} onClick={() => setTheme(t)} className="text-left px-2 py-1 text-sm hover:bg-gray-700 capitalize rounded text-white">
                        {t}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Main Click Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        <div className="text-6xl md:text-9xl font-mono font-bold tracking-tighter select-none">
          {count.toLocaleString()}
        </div>

        <button 
          onPointerDown={handleClick}
          className={`
            w-48 h-48 md:w-64 md:h-64 rounded-full border-4 flex items-center justify-center
            transition-all duration-100 active:scale-90 select-none touch-none
            ${currentTheme.btn}
          `}
        >
          <ShapeIcon size={80} strokeWidth={1} />
        </button>
      </div>

      {/* Shop / Selector */}
      <div className="p-4 md:p-8 bg-black/5 backdrop-blur-sm overflow-x-auto flex gap-4 items-center justify-center h-32 w-full">
        {SHAPES.map(s => {
          const isUnlocked = unlocked.includes(s.id);
          const isSelected = shape === s.id;
          return (
            <button
              key={s.id}
              onClick={() => unlockShape(s.id, s.price)}
              disabled={!isUnlocked && count < s.price}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg min-w-[80px] transition-all
                ${isSelected ? 'bg-white/20 scale-110' : 'hover:bg-white/5'}
                ${!isUnlocked && count < s.price ? 'opacity-30' : 'opacity-100'}
              `}
            >
              <s.icon size={24} />
              <span className="text-xs font-mono">{isUnlocked ? 'OWNED' : s.price}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
};
