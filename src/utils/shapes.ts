
export const generateHeart = (count: number, _radius: number = 10) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    // const u = Math.random() * Math.PI; // For 3D volume
    
    // Heart curve equation (2D base)
    // x = 16sin^3(t)
    // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    
    // Adding some 3D volume
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const z = (Math.random() - 0.5) * 5; // Thickness

    // Randomize slightly to fill volume
    const r = Math.random();
    
    positions[i * 3] = x * r * 0.5;
    positions[i * 3 + 1] = y * r * 0.5;
    positions[i * 3 + 2] = z;
  }
  return positions;
};

export const generateSphere = (count: number, radius: number = 10) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = Math.cbrt(Math.random()) * radius; // Uniform distribution in sphere

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
};

export const generateSaturn = (count: number, radius: number = 8) => {
  const positions = new Float32Array(count * 3);
  const ringCount = Math.floor(count * 0.4);
  const planetCount = count - ringCount;

  // Planet (Sphere)
  for (let i = 0; i < planetCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = Math.cbrt(Math.random()) * radius;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  // Rings (Disk)
  for (let i = planetCount; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const minRingRadius = radius * 1.2;
    const maxRingRadius = radius * 2.5;
    const r = Math.sqrt(Math.random()) * (maxRingRadius - minRingRadius) + minRingRadius;
    
    positions[i * 3] = r * Math.cos(angle);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5; // Thin disk
    positions[i * 3 + 2] = r * Math.sin(angle);
  }
  return positions;
};

export const generateFlower = (count: number, radius: number = 10) => {
  const positions = new Float32Array(count * 3);
  // Phyllotaxis pattern
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(i) / Math.sqrt(count) * radius;
    const theta = i * goldenAngle;
    
    // Create petals by modulating Z
    const petalMod = Math.sin(theta * 5) * 2; 

    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(theta);
    positions[i * 3 + 2] = petalMod * (r/radius) * 5;
  }
  return positions;
};

export const generateFireworks = (count: number, _radius: number = 15) => {
    const positions = new Float32Array(count * 3);
    // Multiple bursts
    const bursts = 5;
    const particlesPerBurst = Math.floor(count / bursts);
    
    for(let b=0; b<bursts; b++) {
        const cx = (Math.random() - 0.5) * 20;
        const cy = (Math.random() - 0.5) * 20;
        const cz = (Math.random() - 0.5) * 10;
        
        for(let i=0; i<particlesPerBurst; i++) {
            const idx = (b * particlesPerBurst + i) * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = Math.random() * 5; // Burst radius
            
            positions[idx] = cx + r * Math.sin(phi) * Math.cos(theta);
            positions[idx+1] = cy + r * Math.sin(phi) * Math.sin(theta);
            positions[idx+2] = cz + r * Math.cos(phi);
        }
    }
    return positions;
}
