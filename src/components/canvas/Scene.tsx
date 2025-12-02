import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ParticleSystem } from './ParticleSystem';
import { Suspense } from 'react';
import { useStore } from '../../store/useStore';

const SceneContent = () => {
    const { isHandDetected } = useStore();

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={60} />
            <OrbitControls 
                enablePan={false} 
                enableZoom={true} 
                minDistance={20} 
                maxDistance={100}
                autoRotate={!isHandDetected}
                autoRotateSpeed={0.5}
            />
            
            <Suspense fallback={null}>
                <ParticleSystem />
            </Suspense>
            
            <ambientLight intensity={0.5} />
        </>
    );
}

export const Scene = () => {
  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas dpr={[1, 2]}>
        <SceneContent />
      </Canvas>
    </div>
  );
};
