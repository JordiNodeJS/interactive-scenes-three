import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { generateHeart, generateSphere, generateSaturn, generateFlower, generateFireworks, generateSpiral, generateCube, generatePyramid, generateDNA } from '../../utils/shapes';

const PARTICLE_COUNT = 20000;

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
  const { currentShape, handTension, particleColor } = useStore();
  
  // Generate initial positions (Sphere as base)
  const initialPositions = useMemo(() => generateSphere(PARTICLE_COUNT), []);
  
  // Generate target positions for all shapes
  const shapes = useMemo(() => ({
    heart: generateHeart(PARTICLE_COUNT),
    flower: generateFlower(PARTICLE_COUNT),
    saturn: generateSaturn(PARTICLE_COUNT),
    buddha: generateSphere(PARTICLE_COUNT), // Placeholder for Buddha, using Sphere for now
    fireworks: generateFireworks(PARTICLE_COUNT),
    spiral: generateSpiral(PARTICLE_COUNT),
    cube: generateCube(PARTICLE_COUNT),
    pyramid: generatePyramid(PARTICLE_COUNT),
    dna: generateDNA(PARTICLE_COUNT),
  }), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    geo.setAttribute('targetPosition', new THREE.BufferAttribute(initialPositions, 3));
    
    const sizes = new Float32Array(PARTICLE_COUNT);
    for(let i=0; i<PARTICLE_COUNT; i++) sizes[i] = Math.random();
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geo;
  }, [initialPositions]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uExpansion: { value: 0 },
    uMorphFactor: { value: 0 },
    uColor: { value: new THREE.Color(particleColor) }
  }), []);

  // Handle shape changes
  useEffect(() => {
    if (pointsRef.current) {
      const targetAttr = pointsRef.current.geometry.attributes.targetPosition as THREE.BufferAttribute;
      const newPositions = shapes[currentShape as keyof typeof shapes] || shapes.heart;
      
      // We want to animate to the new shape.
      // In a real shader morph, we might interpolate between two buffers.
      // For simplicity here, we'll just update the target buffer and let the shader interpolate if we had 'previous' and 'next' attributes.
      // But to keep it simple with one target, we can just set the new target.
      // To make it smooth, we could use two attributes and mix, but let's try a JS-side interpolation for the attribute or just snap for now and improve later.
      
      // Better approach for smooth transition:
      // 1. Current positions become 'start'
      // 2. New shape becomes 'end'
      // 3. Animate a mix factor in shader?
      // Actually, the shader has `position` and `targetPosition`.
      // Let's say `position` is always the CURRENT visual state.
      // Wait, `position` attribute is static usually.
      
      // Let's do this:
      // We will use a GSAP-like approach or manual lerp in useFrame to update the 'position' attribute to match 'targetPosition' over time? No, too heavy for CPU.
      // 2. We set 'position' to that old shape data.
      // 3. We set 'targetPosition' to new shape data.
      // 4. Reset uMorphFactor to 0 and animate to 1.
      
      targetAttr.set(newPositions);
      targetAttr.needsUpdate = true;
      
      // We need to reset the animation
      // But we also need 'position' to be the previous target.
      // We can't easily read back from GPU, but we have the data in `shapes`.
      
      // Let's assume we track 'previousShape'.
    }
  }, [currentShape, shapes]);
  
  // We need a ref to track the previous shape to set the 'from' positions
  const prevShapeRef = useRef<string>('heart');

  useEffect(() => {
     if (pointsRef.current && currentShape !== prevShapeRef.current) {
         const geometry = pointsRef.current.geometry;
         const prevPositions = shapes[prevShapeRef.current as keyof typeof shapes] || shapes.heart;
         const newPositions = shapes[currentShape as keyof typeof shapes] || shapes.heart;
         
         (geometry.attributes.position as THREE.BufferAttribute).set(prevPositions);
         geometry.attributes.position.needsUpdate = true;
         
         (geometry.attributes.targetPosition as THREE.BufferAttribute).set(newPositions);
         geometry.attributes.targetPosition.needsUpdate = true;
         
         // Reset morph factor to 0, we will animate it to 1 in useFrame
         if (pointsRef.current.material instanceof THREE.ShaderMaterial) {
             pointsRef.current.material.uniforms.uMorphFactor.value = 0;
         }
         
         prevShapeRef.current = currentShape;
     }
  }, [currentShape, shapes]);

  useFrame((state) => {
    const { clock } = state;
    if (pointsRef.current && pointsRef.current.material instanceof THREE.ShaderMaterial) {
      pointsRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
      
      // Smoothly interpolate expansion based on hand tension
      // handTension is 0..1
      const currentExpansion = pointsRef.current.material.uniforms.uExpansion.value;
      pointsRef.current.material.uniforms.uExpansion.value = THREE.MathUtils.lerp(currentExpansion, handTension, 0.1);
      
      // Animate morph factor
      const currentMorph = pointsRef.current.material.uniforms.uMorphFactor.value;
      if (currentMorph < 1) {
          pointsRef.current.material.uniforms.uMorphFactor.value = Math.min(1, currentMorph + 0.02);
      }
      
      pointsRef.current.material.uniforms.uColor.value.set(particleColor);
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
