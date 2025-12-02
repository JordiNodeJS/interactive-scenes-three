import { create } from 'zustand';

export type ShapeType = 'heart' | 'flower' | 'saturn' | 'buddha' | 'fireworks' | 'spiral' | 'cube' | 'pyramid' | 'dna';

interface AppState {
  // Hand State
  handTension: number; // 0 to 1 (0 = open, 1 = closed)
  isHandDetected: boolean;
  setHandTension: (tension: number) => void;
  setIsHandDetected: (detected: boolean) => void;

  // Visual State
  currentShape: ShapeType;
  particleColor: string;
  setShape: (shape: ShapeType) => void;
  setParticleColor: (color: string) => void;
}

export const useStore = create<AppState>((set) => ({
  handTension: 0,
  isHandDetected: false,
  setHandTension: (tension) => set({ handTension: tension }),
  setIsHandDetected: (detected) => set({ isHandDetected: detected }),

  currentShape: 'heart',
  particleColor: '#ff0055',
  setShape: (shape) => set({ currentShape: shape }),
  setParticleColor: (color) => set({ particleColor: color }),
}));
