import { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SceneRoot } from './three/SceneRoot';
import { CameraRig } from './three/CameraRig';
import { Effects } from './three/Effects';
import { Hud } from './ui/Hud';

export default function App() {
  return (
    <div className="app">
      <Canvas
        dpr={[1, 2]}
        shadows="soft"
        camera={{ fov: 42, position: [5.5, 3.5, 7.5], near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#070a10']} />
        <fog attach="fog" args={['#070a10', 24, 50]} />
        <Suspense fallback={null}>
          <SceneRoot />
          <CameraRig />
          <Effects />
        </Suspense>
      </Canvas>
      <Hud />
    </div>
  );
}
