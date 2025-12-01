import { Scene } from './components/canvas/Scene';
import { UIOverlay } from './components/ui/UIOverlay';
import { useHandTracking } from './hooks/useHandTracking';

function App() {
  const { videoRef } = useHandTracking();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans">
      {/* Hidden Video Element for MediaPipe */}
      <video 
        ref={videoRef} 
        className="absolute top-0 left-0 opacity-0 pointer-events-none w-px h-px"
        playsInline
      />
      
      <Scene />
      <UIOverlay />
    </div>
  );
}

export default App;
