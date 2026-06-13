import { Environment, Lightformer, ContactShadows, Grid } from '@react-three/drei';
import { useNavStore } from '../nav/useNavStore';
import { NAV_TREE } from '../nav/tree';
import type { SceneKey } from '../nav/types';
import { Level0Computer } from './scenes/Level0Computer';
import { Level1Motherboard } from './scenes/Level1Motherboard';
import { DramModule } from './scenes/dram/DramModule';
import { DramCellArray } from './scenes/dram/DramCellArray';
import { DramCell } from './scenes/dram/DramCell';
import { CpuDie } from './scenes/cpu/CpuDie';
import { AluUnits } from './scenes/cpu/AluUnits';
import { GateAdder } from './scenes/cpu/GateAdder';
import { GateMul } from './scenes/cpu/GateMul';
import { GateShift } from './scenes/cpu/GateShift';
import { GateLatch } from './scenes/cpu/GateLatch';
import { GateFlipflop } from './scenes/cpu/GateFlipflop';
import { CompilerStory } from './scenes/cpu/CompilerStory';
import { MemKitchen } from './scenes/cpu/MemKitchen';
import { RegFile } from './scenes/cpu/RegFile';
import { MuxDetail } from './scenes/cpu/MuxDetail';
import { CmosGate } from './scenes/cpu/CmosGate';
import { MosfetPhysics } from './scenes/cpu/MosfetPhysics';

const SCENES: Record<SceneKey, () => React.JSX.Element> = {
  computer: Level0Computer,
  motherboard: Level1Motherboard,
  dramModule: DramModule,
  dramArray: DramCellArray,
  dramCell: DramCell,
  cpuDie: CpuDie,
  compilerStory: CompilerStory,
  memKitchen: MemKitchen,
  regFile: RegFile,
  muxDetail: MuxDetail,
  aluUnits: AluUnits,
  gateAdder: GateAdder,
  gateMul: GateMul,
  gateShift: GateShift,
  gateLatch: GateLatch,
  gateFlipflop: GateFlipflop,
  cmosGate: CmosGate,
  mosfetPhysics: MosfetPhysics,
};

/** 회로도(XY 평면, 정면) 씬 — 그리드/접지 그림자 없이 균일 조명 */
const FLAT_SCENES: SceneKey[] = [
  'regFile',
  'muxDetail',
  'gateAdder',
  'gateMul',
  'gateShift',
  'gateLatch',
  'gateFlipflop',
  'cmosGate',
];

/** 입체 씬별 바닥 높이 — 접지 그림자(ContactShadows) 위치 */
const FLOOR: Partial<Record<SceneKey, number>> = {
  computer: 0.0,
  motherboard: -0.17,
  dramModule: 0.0,
  dramArray: -0.13,
  dramCell: -0.62,
  cpuDie: -0.07,
  memKitchen: -0.035,
  compilerStory: -0.035,
  aluUnits: -0.19,
};

/** 라이트포머로 만든 스튜디오 환경 — 금속에 부드러운 반사를 만들어 '제품 렌더' 느낌 */
function StudioEnvironment() {
  return (
    <Environment resolution={256} environmentIntensity={0.55} frames={1}>
      {/* 상단 대형 소프트박스 (키) */}
      <Lightformer
        form="rect"
        intensity={3.2}
        position={[0, 6, -1]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 8, 1]}
        color="#cfe0ff"
      />
      {/* 좌측 시안 림 */}
      <Lightformer form="rect" intensity={2.0} position={[-6, 2, 3]} rotation={[0, Math.PI / 2, 0]} scale={[5, 7, 1]} color="#3aa0e0" />
      {/* 우측 웜 림 */}
      <Lightformer form="rect" intensity={1.4} position={[6, 1.5, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 6, 1]} color="#ffc98a" />
      {/* 정면 채움 */}
      <Lightformer form="rect" intensity={0.9} position={[0, 1, 7]} scale={[10, 6, 1]} color="#9fb6d6" />
      {/* 하단 어두운 바운스 */}
      <Lightformer form="rect" intensity={0.5} position={[0, -4, 3]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 6, 1]} color="#101826" />
    </Environment>
  );
}

export function SceneRoot() {
  const sceneKey = useNavStore((s) => NAV_TREE[s.currentId].sceneKey);
  const Scene = SCENES[sceneKey];
  const flat = FLAT_SCENES.includes(sceneKey);
  const floor = FLOOR[sceneKey];

  return (
    <group>
      <StudioEnvironment />

      {/* 직접광: 환경광 위에 형태를 또렷하게 하는 키/필/림 */}
      <ambientLight intensity={flat ? 0.5 : 0.18} />
      <directionalLight position={[6, 9, 5]} intensity={flat ? 0.8 : 2.0} color="#eef4ff" />
      <directionalLight position={[-7, 5, -3]} intensity={0.45} color="#7fb0e8" />
      <pointLight position={[0, 4, 9]} intensity={flat ? 0.3 : 0.7} color="#4cc8ff" distance={30} decay={1.4} />
      {!flat && <pointLight position={[-5, 1, -5]} intensity={0.5} color="#ffb454" distance={25} decay={1.6} />}

      {/* 접지 그림자 — 물체를 바닥에 '붙여' 떠 보이지 않게 */}
      {floor !== undefined && (
        <ContactShadows
          position={[0, floor, 0]}
          scale={26}
          resolution={1024}
          blur={2.6}
          opacity={0.55}
          far={6}
          color="#000308"
        />
      )}

      {!flat && (
        <Grid
          position={[0, (floor ?? -0.5) - 0.02, 0]}
          args={[60, 60]}
          cellSize={0.6}
          cellThickness={0.6}
          cellColor="#141d2a"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#1f2c42"
          fadeDistance={30}
          fadeStrength={1.6}
          infiniteGrid
        />
      )}

      <Scene key={sceneKey} />
    </group>
  );
}
