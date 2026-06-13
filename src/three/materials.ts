import * as THREE from 'three';

export const COLORS = {
  accent: '#4cc8ff',
  amber: '#ffb454',
  green: '#7ee787',
  pmos: '#ff7a59',
  nmos: '#5aa2ff',
  pcb: '#0d3b2e',
  pcbDark: '#092a20',
  copper: '#b87333',
  chip: '#15191f',
  chipLight: '#2a3142',
  silver: '#aab4c0',
  die: '#1a2030',
  gold: '#d4a843',
} as const;

/** 공유하지 말 것 — Selectable이 emissive를 만지므로 호출마다 새로 생성 */
export const mat = {
  aluminum: () =>
    new THREE.MeshStandardMaterial({ color: COLORS.silver, metalness: 0.85, roughness: 0.35 }),
  pcb: () => new THREE.MeshStandardMaterial({ color: COLORS.pcb, roughness: 0.6, metalness: 0.1 }),
  chip: () => new THREE.MeshStandardMaterial({ color: COLORS.chip, roughness: 0.4, metalness: 0.3 }),
  chipLight: () =>
    new THREE.MeshStandardMaterial({ color: COLORS.chipLight, roughness: 0.45, metalness: 0.25 }),
  copper: () =>
    new THREE.MeshStandardMaterial({ color: COLORS.copper, metalness: 0.9, roughness: 0.3 }),
  gold: () => new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: 0.9, roughness: 0.25 }),
  die: () => new THREE.MeshStandardMaterial({ color: COLORS.die, roughness: 0.35, metalness: 0.4 }),
  glow: (color: string, intensity = 2) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity,
      toneMapped: false,
    }),
  /** 환경을 반사/투과하는 유리 — 클리어코트 + 낮은 거칠기 */
  glass: (color = '#cfe6ff', opacity = 0.22) =>
    new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0,
      roughness: 0.06,
      transparent: true,
      opacity,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      ior: 1.45,
      envMapIntensity: 1.4,
      side: THREE.DoubleSide,
    }),
};
