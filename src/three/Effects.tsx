import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

export function Effects() {
  return (
    <EffectComposer>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1.0} luminanceSmoothing={0.25} />
      <Vignette eskil={false} offset={0.18} darkness={0.78} />
    </EffectComposer>
  );
}
