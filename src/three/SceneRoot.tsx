import { Grid } from '@react-three/drei';
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

/** 그리드 바닥이 어울리지 않는 회로도(XY 평면) 씬 */
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

export function SceneRoot() {
  const sceneKey = useNavStore((s) => NAV_TREE[s.currentId].sceneKey);
  const Scene = SCENES[sceneKey];
  const flat = FLAT_SCENES.includes(sceneKey);

  return (
    <group>
      {/* 조명 */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 6]} intensity={1.4} />
      <directionalLight position={[-6, 6, -4]} intensity={0.5} color="#9bc4e8" />
      <pointLight position={[0, 5, 8]} intensity={0.5} color="#4cc8ff" />

      {!flat && (
        <Grid
          position={[0, -0.55, 0]}
          args={[60, 60]}
          cellSize={0.6}
          cellColor="#1a2230"
          sectionSize={3}
          sectionColor="#243049"
          fadeDistance={28}
          fadeStrength={1.5}
          infiniteGrid
        />
      )}

      <Scene key={sceneKey} />
    </group>
  );
}
