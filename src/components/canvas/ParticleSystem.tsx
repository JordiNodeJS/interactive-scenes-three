import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { generateHeart, generateSphere, generateSaturn, generateFlower, generateFireworks, generateSpiral, generateCube, generatePyramid, generateDNA } from '../../utils/shapes';

const PARTICLE_COUNT = 20000;

// Pre-generate shapes outside component to avoid re-calculation and keep pure render
// This runs once when the module is loaded
const SHAPES = {
  heart: generateHeart(PARTICLE_COUNT),
  flower: generateFlower(PARTICLE_COUNT),
  saturn: generateSaturn(PARTICLE_COUNT),
  buddha: generateSphere(PARTICLE_COUNT), // Placeholder
  fireworks: generateFireworks(PARTICLE_COUNT),
  spiral: generateSpiral(PARTICLE_COUNT),
  cube: generateCube(PARTICLE_COUNT),
  pyramid: generatePyramid(PARTICLE_COUNT),
  dna: generateDNA(PARTICLE_COUNT),
};

const INITIAL_POSITIONS = generateSphere(PARTICLE_COUNT);
const SIZES = new Float32Array(PARTICLE_COUNT);
for(let i=0; i<PARTICLE_COUNT; i++) SIZES[i] = Math.random();

const vertexShader = `
  uniform float uTime;
  uniform float uExpansion;
  uniform float uMorphFactor;
  
  attribute vec3 targetPosition;
  attribute float size;
  
  varying vec3 vColor;
  varying float vDistance;

  void main() {
    // Morphing logic
    vec3 pos = mix(position, targetPosition, uMorphFactor);
    
    // Expansion based on hand tension (uExpansion)
    // 0 = normal, 1 = expanded/exploded
    
    // Add some noise/movement
    float noise = sin(pos.x * 0.1 + uTime) * cos(pos.y * 0.1 + uTime);
    
    vec3 expandedPos = pos + (normalize(pos) * uExpansion * 10.0);
    
    // Add breathing effect
    expandedPos += normalize(pos) * sin(uTime * 2.0) * 0.2;

    vec4 mvPosition = modelViewMatrix * vec4(expandedPos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    vDistance = length(expandedPos);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vDistance;

  void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 3.0);
    
    vec3 finalColor = uColor;
    
    // Add some variation based on distance from center
    finalColor += vec3(vDistance * 0.02);

    gl_FragColor = vec4(finalColor, strength);
  }
`;

export const ParticleSystem = () => {
  const pointsRef = useRef<THREE.Points>(null);
  // Select only stable state that triggers re-renders (Shape/Color)
  const currentShape = useStore(state => state.currentShape);
  const particleColor = useStore(state => state.particleColor);
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    // Create separate arrays to avoid aliasing bugs
    const posArray = new Float32Array(INITIAL_POSITIONS);
    const targetArray = new Float32Array(INITIAL_POSITIONS);
    
    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geo.setAttribute('targetPosition', new THREE.BufferAttribute(targetArray, 3));
    
    geo.setAttribute('size', new THREE.BufferAttribute(SIZES, 1));
    
    return geo;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uExpansion: { value: 0 },
    uMorphFactor: { value: 0 },
    uColor: { value: new THREE.Color(particleColor) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []); // particleColor dependency removed as we update it in useFrame

  // We need a ref to track the previous shape to set the 'from' positions
  const prevShapeRef = useRef<string>('heart');

  // Handle shape changes
  useEffect(() => {
     if (pointsRef.current && currentShape !== prevShapeRef.current) {
         const geometry = pointsRef.current.geometry;
         const prevPositions = SHAPES[prevShapeRef.current as keyof typeof SHAPES] || SHAPES.heart;
         const newPositions = SHAPES[currentShape as keyof typeof SHAPES] || SHAPES.heart;
         
         // Set current positions to where we were coming FROM
         (geometry.attributes.position as THREE.BufferAttribute).set(prevPositions);
         geometry.attributes.position.needsUpdate = true;
         
         // Set target positions to where we are going TO
         (geometry.attributes.targetPosition as THREE.BufferAttribute).set(newPositions);
         geometry.attributes.targetPosition.needsUpdate = true;
         
         // Reset morph factor to 0, we will animate it to 1 in useFrame
         if (pointsRef.current.material instanceof THREE.ShaderMaterial) {
             pointsRef.current.material.uniforms.uMorphFactor.value = 0;
         }
         
         prevShapeRef.current = currentShape;
     }
  }, [currentShape]);

  useFrame((state) => {
    const { clock } = state;
    
    // Read transient state directly to avoid re-renders
    const { handTension, handRotation, handPosition, isHandDetected } = useStore.getState();

    if (pointsRef.current && pointsRef.current.material instanceof THREE.ShaderMaterial) {
      pointsRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
      
      // Smoothly interpolate expansion based on hand tension
      const currentExpansion = pointsRef.current.material.uniforms.uExpansion.value;
      pointsRef.current.material.uniforms.uExpansion.value = THREE.MathUtils.lerp(currentExpansion, handTension, 0.1);
      
      // Animate morph factor
      const currentMorph = pointsRef.current.material.uniforms.uMorphFactor.value;
      if (currentMorph < 1) {
          pointsRef.current.material.uniforms.uMorphFactor.value = Math.min(1, currentMorph + 0.02);
      }
      
      pointsRef.current.material.uniforms.uColor.value.set(particleColor);

      // --- HAND CONTROL TRANSFORMATIONS ---
      if (isHandDetected) {
        // Map hand position X to Rotation Y (yaw)
        // Map hand position Y to Rotation X (pitch)
        // Map hand rotation (roll) to Rotation Z
        
        // Target rotation
        const targetRotY = -handPosition.x * 2; // Multiplier for sensitivity
        const targetRotX = handPosition.y * 2;
        const targetRotZ = handRotation;

        // Smooth interpolation
        pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetRotX, 0.1);
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotY, 0.1);
        pointsRef.current.rotation.z = THREE.MathUtils.lerp(pointsRef.current.rotation.z, targetRotZ, 0.1);
      } else {
        // Auto rotation when no hand
        pointsRef.current.rotation.y += 0.005;
        // Return to upright
        pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, 0, 0.05);
        pointsRef.current.rotation.z = THREE.MathUtils.lerp(pointsRef.current.rotation.z, 0, 0.05);
      }
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
