import { useEffect, useRef } from 'react';
import { Hands, type Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { useStore } from '../store/useStore';

export const useHandTracking = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setHandTension, setIsHandDetected } = useStore();

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    return () => {
      hands.close();
    };
  }, []);

  const onResults = (results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];
      
      // Calculate tension based on distance between fingertips and palm base (wrist)
      // This is a simplified approximation.
      // Wrist: 0
      // Tips: 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
      
      const wrist = landmarks[0];
      const tips = [4, 8, 12, 16, 20];
      
      let totalDist = 0;
      tips.forEach(tipIdx => {
        const tip = landmarks[tipIdx];
        const dist = Math.sqrt(
          Math.pow(tip.x - wrist.x, 2) + 
          Math.pow(tip.y - wrist.y, 2) + 
          Math.pow(tip.z - wrist.z, 2)
        );
        totalDist += dist;
      });

      // Normalize tension
      // Open hand average dist is roughly 0.3 - 0.5 depending on Z
      // Closed hand is roughly 0.1 - 0.2
      // We'll map this range to 0-1
      // Note: These values might need tuning based on testing
      
      const maxOpenDist = 2.0; // Sum of 5 fingers
      const minClosedDist = 0.5;
      
      // Invert because smaller distance = higher tension (closed)
      let tension = 1 - ((totalDist - minClosedDist) / (maxOpenDist - minClosedDist));
      tension = Math.max(0, Math.min(1, tension));
      
      setHandTension(tension);
    } else {
      setIsHandDetected(false);
      setHandTension(0);
    }
  };

  return { videoRef };
};
