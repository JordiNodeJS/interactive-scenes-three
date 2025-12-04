import { useEffect, useRef, useCallback } from "react";
import { Hands, type Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { useStore } from "../store/useStore";

export const useHandTracking = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const prevTension = useRef(0);
  const prevPosition = useRef({ x: 0, y: 0 });
  const prevRotation = useRef(0);
  const gestureStabilizer = useRef({
    pendingGesture: "None",
    count: 0,
  });

  const { setHandState, isCameraActive } = useStore();

  const detectGesture = useCallback((landmarks: any[], tension: number) => {
    // Simple gesture detection
    if (tension > 0.9) return "Closed Fist";
    if (tension < 0.1) return "Open Hand";

    // Detect Victory (Index and Middle up)
    // Landmark indices: Wrist=0, IndexTip=8, IndexPIP=6, MiddleTip=12, MiddlePIP=10, RingTip=16, PinkyTip=20
    // Check distances from wrist to tip vs wrist to PIP?
    // Or just simple y check if hand is upright.
    // Let's use distance from wrist. Extended finger tip is far from wrist. Folded is close.

    const wrist = landmarks[0];
    const dist = (idx: number) => {
      const p = landmarks[idx];
      return Math.sqrt(Math.pow(p.x - wrist.x, 2) + Math.pow(p.y - wrist.y, 2));
    };

    // Normalize by palm size (Wrist to Middle MCP (9))
    const palmSize = dist(9);

    // Helper for extension check (kept for future use)
    const _isExtended = (tipIdx: number, pipIdx: number) => {
      return dist(tipIdx) > dist(pipIdx) + 0.1 * palmSize;
    };
    void _isExtended; // Suppress unused warning

    // Better: Check if tip is further from wrist than PIP
    // This works regardless of rotation mostly

    // Using simple distance check relative to wrist for now as it's robust enough for this demo
    const indexExt = dist(8) > dist(6);
    const middleExt = dist(12) > dist(10);
    const ringExt = dist(16) > dist(14);
    const pinkyExt = dist(20) > dist(18);
    const thumbExt = dist(4) > dist(2); // Thumb is tricky, but roughly

    if (indexExt && middleExt && !ringExt && !pinkyExt) return "Victory";
    if (indexExt && !middleExt && !ringExt && !pinkyExt) return "Pointing";
    if (indexExt && !middleExt && !ringExt && pinkyExt && thumbExt)
      return "Rock"; // Rock/Devil horns
    if (!indexExt && !middleExt && !ringExt && !pinkyExt && thumbExt)
      return "Thumbs Up"; // Maybe

    return "Unknown";
  }, []);

  const onResults = useCallback(
    (results: Results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // 1. Calculate Tension
        const wrist = landmarks[0];
        const tips = [4, 8, 12, 16, 20];

        let totalDist = 0;
        tips.forEach((tipIdx) => {
          const tip = landmarks[tipIdx];
          const dist = Math.sqrt(
            Math.pow(tip.x - wrist.x, 2) +
              Math.pow(tip.y - wrist.y, 2) +
              Math.pow(tip.z - wrist.z, 2)
          );
          totalDist += dist;
        });

        const maxOpenDist = 2.0;
        const minClosedDist = 0.5;

        let tension =
          1 - (totalDist - minClosedDist) / (maxOpenDist - minClosedDist);
        tension = Math.max(0, Math.min(1, tension));

        // Smooth Tension
        const alphaTension = 0.2;
        const smoothedTension =
          prevTension.current + (tension - prevTension.current) * alphaTension;
        prevTension.current = smoothedTension;

        // Detect Gesture
        const detectedGesture = detectGesture(landmarks, smoothedTension);

        let newGesture = gestureStabilizer.current.pendingGesture;
        // Stabilize Gesture
        const stabilizer = gestureStabilizer.current;
        if (detectedGesture === stabilizer.pendingGesture) {
          stabilizer.count++;
          // Require consecutive frames to switch gesture
          if (stabilizer.count > 4) {
            newGesture = detectedGesture;
          }
        } else {
          stabilizer.pendingGesture = detectedGesture;
          stabilizer.count = 0;
        }

        // 2. Calculate Hand Position (Center of palm approx)
        const middleMCP = landmarks[9];
        const centerX = (wrist.x + middleMCP.x) / 2;
        const centerY = (wrist.y + middleMCP.y) / 2;

        const posX = (centerX - 0.5) * 2;
        const posY = -(centerY - 0.5) * 2;

        // Smooth Position
        const alphaPos = 0.2;
        const smoothedX =
          prevPosition.current.x + (posX - prevPosition.current.x) * alphaPos;
        const smoothedY =
          prevPosition.current.y + (posY - prevPosition.current.y) * alphaPos;
        prevPosition.current = { x: smoothedX, y: smoothedY };

        // 3. Calculate Hand Rotation (Roll)
        const dx = middleMCP.x - wrist.x;
        const dy = middleMCP.y - wrist.y;
        const rotation = Math.atan2(dy, dx) + Math.PI / 2;

        // Smooth Rotation
        const alphaRot = 0.2;
        const smoothedRot =
          prevRotation.current + (-rotation - prevRotation.current) * alphaRot;
        prevRotation.current = smoothedRot;

        // Batch update all hand state
        setHandState({
          isHandDetected: true,
          handTension: smoothedTension,
          handPosition: { x: smoothedX, y: smoothedY },
          handRotation: smoothedRot,
          currentGesture: newGesture,
        });
      } else {
        // Reset stabilizer on loss of tracking
        gestureStabilizer.current = { pendingGesture: "None", count: 0 };

        setHandState({
          isHandDetected: false,
          handTension: 0,
          currentGesture: "None",
        });
      }
    },
    [detectGesture, setHandState]
  );

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
    handsRef.current = hands;

    return () => {
      hands.close();
    };
  }, [onResults]);

  // Handle Camera Toggle
  useEffect(() => {
    if (isCameraActive && videoRef.current && handsRef.current) {
      if (!cameraRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        cameraRef.current = camera;
        camera.start();
      }
    } else {
      if (cameraRef.current) {
        // Try to stop the tracks manually as Camera util might not fully stop
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
        cameraRef.current = null;
        setHandState({
          isHandDetected: false,
          currentGesture: "None",
        });
      }
    }
  }, [isCameraActive, setHandState]);

  return { videoRef };
};
