import React from 'react';
import { useStore, type ShapeType } from '../../store/useStore';
import { Heart, Flower, Globe, Sparkles, Smile, Tornado, Box, Triangle, Dna, Camera, CameraOff } from 'lucide-react';

const shapes: { id: ShapeType; icon: React.ReactNode; label: string }[] = [
  { id: 'heart', icon: <Heart size={20} />, label: 'Heart' },
  { id: 'flower', icon: <Flower size={20} />, label: 'Flower' },
  { id: 'saturn', icon: <Globe size={20} />, label: 'Saturn' },
  { id: 'buddha', icon: <Smile size={20} />, label: 'Buddha' },
  { id: 'fireworks', icon: <Sparkles size={20} />, label: 'Fireworks' },
  { id: 'spiral', icon: <Tornado size={20} />, label: 'Spiral' },
  { id: 'cube', icon: <Box size={20} />, label: 'Cube' },
  { id: 'pyramid', icon: <Triangle size={20} />, label: 'Pyramid' },
  { id: 'dna', icon: <Dna size={20} />, label: 'DNA' },
];

const colors = [
  '#ff0055', // Pink/Red
  '#00ffaa', // Teal
  '#5500ff', // Purple
  '#ffaa00', // Orange
  '#00aaff', // Blue
  '#ffffff', // White
];

const gestureIcons: Record<string, string> = {
  'Closed Fist': '✊',
  'Open Hand': '✋',
  'Victory': '✌️',
  'Pointing': '☝️',
  'Rock': '🤘',
  'Thumbs Up': '👍',
  'Unknown': '❓',
  'None': ''
};

export const UIOverlay = () => {
  const { 
    currentShape, 
    setShape, 
    particleColor, 
    setParticleColor, 
    isHandDetected, 
    handTension,
    isCameraActive,
    setIsCameraActive,
    currentGesture
  } = useStore();

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Header / Status */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-wider mb-1">PARTICLE FLOW</h1>
          <p className="text-white/60 text-sm">Interactive 3D System</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <button 
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isCameraActive 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
            }`}
          >
            {isCameraActive ? <Camera size={14} /> : <CameraOff size={14} />}
            {isCameraActive ? 'CAMERA ON' : 'CAMERA OFF'}
          </button>

          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isHandDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {isHandDetected ? 'HAND DETECTED' : 'NO HAND DETECTED'}
          </div>

           {/* Gesture Display */}
           <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 border border-white/10 bg-black/20 text-white/80 flex items-center gap-2 ${isHandDetected ? 'opacity-100' : 'opacity-0'}`}>
             <span>GESTURE:</span>
             <div className="flex items-center gap-2">
               <span className="text-lg leading-none">{gestureIcons[currentGesture] || ''}</span>
               <span className="text-white font-bold uppercase">{currentGesture}</span>
             </div>
          </div>

          {/* Tension Bar - Always rendered to prevent layout shift but controlled opacity/visibility */}
          <div className={`flex items-center gap-2 transition-opacity duration-300 ${isHandDetected ? 'opacity-100' : 'opacity-0'}`}>
             <span className="text-white/50 text-xs">TENSION</span>
             <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                 <div 
                     className="h-full bg-white transition-all duration-100"
                     style={{ width: `${handTension * 100}%` }}
                 />
             </div>
          </div>
        </div>
      </div>

      {/* Controls - Fixed Position at Bottom Left */}
      <div className="absolute bottom-24 left-6 flex flex-col gap-6 pointer-events-auto items-start">
        
        {/* Shape Selector */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <h3 className="text-white/50 text-xs font-bold mb-3 uppercase tracking-wider">Shape</h3>
          <div className="grid grid-cols-5 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => setShape(shape.id)}
                className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 group relative ${
                  currentShape === shape.id 
                    ? 'bg-white/20 text-white shadow-lg shadow-white/5' 
                    : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white/80'
                }`}
                title={shape.label}
              >
                {shape.icon}
                <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 whitespace-nowrap bg-black/80 px-2 py-1 rounded pointer-events-none z-20">
                    {shape.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <h3 className="text-white/50 text-xs font-bold mb-3 uppercase tracking-wider">Color</h3>
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setParticleColor(color)}
                className={`w-8 h-8 rounded-full transition-transform duration-300 border-2 ${
                  particleColor === color ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

      </div>
      
      {/* Footer / Instructions */}
      <div className="absolute bottom-6 left-0 right-0 text-white/30 text-xs text-center">
        <p>Show your hand to interact. Close hand to expand particles.</p>
      </div>
    </div>
  );
};
