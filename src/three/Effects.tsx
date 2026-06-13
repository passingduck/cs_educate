import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  SMAA,
  Vignette,
} from '@react-three/postprocessing';

/**
 * 포스트프로세싱 스택.
 * N8AO(주변광 차폐)가 crevice를 어둡게 잡아 입체감을 만들고,
 * Bloom이 emissive(toneMapped=false) 발광만 번지게 한다. 톤매핑은 gl에서 ACES.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO
        quality="medium"
        aoRadius={1.3}
        distanceFalloff={1.0}
        intensity={2.4}
        color="#04070d"
        halfRes
      />
      <Bloom mipmapBlur intensity={0.62} luminanceThreshold={1.0} luminanceSmoothing={0.3} radius={0.7} />
      <HueSaturation saturation={0.08} />
      <BrightnessContrast brightness={0.0} contrast={0.06} />
      <Vignette eskil={false} offset={0.2} darkness={0.72} />
      <SMAA />
    </EffectComposer>
  );
}
