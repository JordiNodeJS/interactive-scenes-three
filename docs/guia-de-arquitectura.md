# ROL
Actúa como un Desarrollador Frontend Experto y Tecnólogo Creativo especializado en WebGL, React y Computer Vision. Tu objetivo es construir una aplicación web interactiva de "Escenas de Partículas 3D" controlada por gestos de la mano en tiempo real.

# OBJETIVO
Crear un proyecto React + Vite + TypeScript que renderice un sistema de 20,000 partículas en 3D. Las partículas deben transformarse (morphing) entre diferentes formas geométricas (Corazón, Esfera, Saturno, etc.). La interacción se realiza mediante la webcam usando MediaPipe Hands: la tensión de la mano (abrir/cerrar) explota/expande las partículas, y la posición de la mano rota la escena.

# TECH STACK
- **Core:** React 19, TypeScript, Vite.
- **3D:** Three.js, @react-three/fiber, @react-three/drei.
- **Vision:** @mediapipe/hands, @mediapipe/camera_utils.
- **Estado:** Zustand (para gestión de estado global de alta frecuencia).
- **Estilos:** TailwindCSS v3.
- **Iconos:** Lucide-react.

# ESTRUCTURA DEL PROYECTO
Organiza el código en:
src/
  components/
    canvas/ (Scene.tsx, ParticleSystem.tsx)
    ui/ (UIOverlay.tsx - controles de UI)
  hooks/ (useHandTracking.ts - lógica de mediapipe)
  store/ (useStore.ts - estado global)
  utils/ (shapes.ts - matemáticas para generar coordenadas)
  App.tsx

# REQUERIMIENTOS TÉCNICOS DETALLADOS

1. **Gestión de Estado (Zustand):**
   - Crea un store `useStore` que maneje:
     - `handTension` (0 a 1, donde 1 es puño cerrado).
     - `handPosition` ({x, y} normalizado).
     - `handRotation` (rotación de la mano en radianes).
     - `currentGesture` (string: 'Victory', 'Open Hand', 'Closed Fist', etc.).
     - `currentShape` (string para controlar la forma actual).
     - `particleColor` (hex string).

2. **Hand Tracking (Hook Personalizado):**
   - Implementa `useHandTracking`.
   - Inicializa `MediaPipe Hands` y `Camera`.
   - Procesa los landmarks para calcular:
     - **Tensión:** Distancia promedio de las puntas de los dedos a la muñeca.
     - **Posición:** Centro de la palma suavizado.
     - **Rotación:** Ángulo aproximado de la mano.
   - Utiliza interpolación lineal (Lerp) para suavizar todos los valores y evitar "jittering".
   - Escribe los valores en el store de Zustand.

3. **Sistema de Partículas (ParticleSystem.tsx):**
   - **IMPORTANTE:** Rendimiento crítico. No uses estados de React dentro del loop de animación (`useFrame`).
   - Usa `THREE.BufferGeometry` con atributos personalizados:
     - `position`: Posición actual.
     - `targetPosition`: Posición de la forma destino (para morphing).
     - `size`: Tamaño aleatorio.
   - Usa `THREE.ShaderMaterial` personalizado:
     - **Vertex Shader:** Debe manejar el morphing (`mix(position, targetPosition, uMorphFactor)`) y la expansión basada en la tensión de la mano. Añade ruido/movimiento senoidal para que parezca vivo.
     - **Fragment Shader:** Renderiza puntos circulares suaves con un color base.
   - En `useFrame`:
     - Lee el estado de Zustand (`useStore.getState()`) directamente para evitar re-renders de React.
     - Actualiza los uniforms del shader (`uTime`, `uExpansion`, `uMorphFactor`).
     - Rota la nube de puntos basándose en la posición de la mano.

4. **Matemáticas de Formas (shapes.ts):**
   - Crea funciones generadoras que devuelvan arrays `Float32Array` con coordenadas (x, y, z) para 20,000 puntos:
     - `generateSphere`, `generateHeart`, `generateSaturn` (con anillos), `generateSpiral`, etc.
   - Pre-calcula estas formas al inicio para evitar lag al cambiar de forma.

5. **UI:**
   - Una capa superpuesta simple con botones para cambiar la forma (`currentShape`) y el color (`particleColor`).
   - Indicador visual del gesto detectado y estado de la cámara.

# PASOS DE IMPLEMENTACIÓN
1. Configura el proyecto Vite con las dependencias necesarias.
2. Crea el archivo de utilidades `shapes.ts` con al menos 3 algoritmos de formas.
3. Configura el store de Zustand.
4. Implementa el hook de MediaPipe para obtener datos de la mano robustos.
5. Construye la escena 3D y el sistema de partículas con Shaders personalizados.
6. Integra todo en App.tsx asegurando que el video de la webcam esté oculto pero activo.

Genera el código completo, priorizando la optimización de rendimiento en el renderizado 3D.