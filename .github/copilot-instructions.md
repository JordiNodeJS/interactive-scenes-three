## Quick Overview

- **Purpose:** Interactive 3D scenes using React + Three.js with hand-driven controls via MediaPipe Hands.
- **Main runtime:** Vite dev server (`pnpm dev`). Production build uses `tsc -b && vite build`.

## Big Picture Architecture

- `src/main.tsx` → app boot; `src/App.tsx` composes the app: hidden `<video>` for MediaPipe, `Scene` and `UIOverlay`.
- `src/components/canvas/Scene.tsx` and `src/components/canvas/ParticleSystem.tsx` host the 3D scene built with `@react-three/fiber`.
- `src/hooks/useHandTracking.ts` integrates MediaPipe (`@mediapipe/hands`) + camera utils and maps landmarks → stable hand state.
- `src/store/useStore.ts` is the single source of truth (Zustand). Short-lived animation/transient data is intentionally read directly via `useStore.getState()` in render loops to avoid React re-renders.
- `src/utils/shapes.ts` contains deterministic particle generators used by the `ParticleSystem` for morph targets.

## Key Patterns & Conventions (project-specific)

- State: use `useStore` for global state. `setHandState` accepts a partial state and merges it (see `useStore.ts`). Prefer merging for hand updates.
- Per-frame data: avoid React state for high-frequency values (hand position, rotation, tension). The render loop reads transient values with `useStore.getState()` or refs.
- Geometry: large particle buffers are pre-generated at module load (see `ParticleSystem.tsx` constants `SHAPES` and `INITIAL_POSITIONS`) to avoid recalculation and GC churn.
- Shaders: vertex/fragment GLSL are inline strings in `ParticleSystem.tsx`. Uniforms are updated via `useFrame`; changing a uniform should not be done via React state updates.
- Gesture stability: `useHandTracking.ts` implements a stabilizer pattern (pendingGesture + count). Tune thresholds there when improving detection.

## Common Tasks & Where To Edit

- Add a new shape: add generator in `src/utils/shapes.ts`, add the key to `ShapeType` in `src/store/useStore.ts`, and include it in `SHAPES` in `ParticleSystem.tsx`.
  - Example: add `export const generateMyShape = (count:number)=>Float32Array` then map it in `SHAPES`.
- Adjust particle appearance or behavior: edit uniforms / `vertexShader` / `fragmentShader` in `src/components/canvas/ParticleSystem.tsx` and update how `uExpansion`/`uMorphFactor` are derived from `handTension`.
- Change gesture mapping or smoothing: edit `detectGesture`, smoothing constants and stabilization logic in `src/hooks/useHandTracking.ts`.
- Toggle camera or UI controls: `src/components/ui/UIOverlay.tsx` (UI controls) and `useStore.ts` (state toggles like `isCameraActive`).

## Build / Dev / Debug Workflow

- Dev server: `pnpm run dev` (Vite). Open the app in the browser and watch the console for runtime shader / WebGL errors.
- Full build: `pnpm run build` (runs `tsc -b && vite build`). Use `pnpm run preview` to inspect the production build locally.
- Lint: `pnpm run lint` (runs `eslint .`).
- TypeScript: `tsconfig.json` and `tsconfig.app.json` are present — `build` uses `tsc -b` so be mindful of composite project settings if you add references.

## Integration Points & External Dependencies

- MediaPipe: `@mediapipe/hands` and `@mediapipe/camera_utils`. The hook uses CDN via `locateFile` — no local model files required.
- Three stack: `three`, `@react-three/fiber`, `@react-three/drei` for cameras and controls.
- State: `zustand` provides a small, synchronous global store. Code relies on direct `getState()` reads inside `useFrame` to stay performant.

## Performance Notes / Pitfalls

- Particle count is high (e.g., `PARTICLE_COUNT = 20000`). Avoid creating new BufferGeometries every render. Use `needsUpdate` on attributes instead.
- Avoid React re-renders from per-frame values — use refs or read from `useStore.getState()`.
- When editing shaders, syntax errors will appear as runtime WebGL errors in the dev console. Inspect shader compile logs in the browser console.

## Quick Examples

- Add shape (pseudo):

```ts
// src/utils/shapes.ts
export const generateMyShape = (count: number) => {
  /* return Float32Array */
};
// src/store/useStore.ts -> add 'myshape' to ShapeType
// src/components/canvas/ParticleSystem.tsx -> add to SHAPES mapping
```

- Tune gesture threshold:

```ts
// src/hooks/useHandTracking.ts
// change minDetectionConfidence or stabilizer count
hands.setOptions({ minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
```

## What I could not discover automatically

- There are no automated tests or CI configuration files in the repository root to infer test or CI flows. If you have specific CI steps or release rules, add them to the repo and I will incorporate them here.

If you'd like, I can adjust tone, add examples for common edits you make, or integrate your CI/test commands. Feedback? Which areas should be expanded or shortened?
