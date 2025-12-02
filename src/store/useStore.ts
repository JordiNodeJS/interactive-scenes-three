import { create } from 'zustand';

export type ShapeType = 'heart' | 'flower' | 'saturn' | 'buddha' | 'fireworks' | 'spiral' | 'cube' | 'pyramid' | 'dna';

interface AppState {
  // Hand State
  handTension: number; // 0 to 1 (0 = open, 1 = closed)
  isHandDetected: boolean;
  handRotation: number; // Roll in radians
  handPosition: { x: number, y: number }; // Normalized -1 to 1
  currentGesture: string;
  setHandTension: (tension: number) => void;
  setIsHandDetected: (detected: boolean) => void;
  setHandRotation: (rotation: number) => void;
  setHandPosition: (position: { x: number, y: number }) => void;
  setCurrentGesture: (gesture: string) => void;

  // Camera State
  isCameraActive: boolean;
  setIsCameraActive: (active: boolean) => void;

  // Visual State
  currentShape: ShapeType;
  particleColor: string;
  setShape: (shape: ShapeType) => void;
  setParticleColor: (color: string) => void;
}

export const useStore = create<AppState>((set) => ({
  handTension: 0,
  isHandDetected: false,
  handRotation: 0,
  handPosition: { x: 0, y: 0 },
  currentGesture: 'None',
  setHandTension: (tension) => set({ handTension: tension }),
  setIsHandDetected: (detected) => set({ isHandDetected: detected }),
  setHandRotation: (rotation) => set({ handRotation: rotation }),
  setHandPosition: (position) => set({ handPosition: position }),
  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),

  isCameraActive: true,
  setIsCameraActive: (active) => set({ isCameraActive: active }),

  currentShape: 'heart',
  particleColor: '#ff0055',
  setShape: (shape) => set({ currentShape: shape }),
  setParticleColor: (color) => set({ particleColor: color }),
}));
