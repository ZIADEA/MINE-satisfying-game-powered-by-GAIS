export enum GameType {
  MENU = 'MENU',
  CROSSWORD = 'CROSSWORD',
  WORD_SEARCH = 'WORD_SEARCH',
  CLICKER = 'CLICKER',
  LABYRINTH = 'LABYRINTH',
  RUNNER = 'RUNNER',
}

export type ThemeMode = 'black' | 'white' | 'dark';

export interface BaseGameProps {
  onExit: () => void;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface ClickerState {
  count: number;
  shape: string;
  theme: ThemeMode;
  unlockedShapes: string[];
}

// Simple Audio Synth Types
export type SoundType = 'click' | 'success' | 'fail' | 'pop';
