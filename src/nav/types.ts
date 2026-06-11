export type NodeId =
  | 'computer'
  | 'motherboard'
  | 'ssd'
  | 'dram'
  | 'dram-array'
  | 'dram-cell'
  | 'cpu'
  | 'cpu-boot'
  | 'cpu-regdemo'
  | 'alu'
  | 'alu-add'
  | 'alu-mul'
  | 'alu-shift'
  | 'cmos'
  | 'mosfet';

export type SceneKey =
  | 'computer'
  | 'motherboard'
  | 'dramModule'
  | 'dramArray'
  | 'dramCell'
  | 'cpuDie'
  | 'aluUnits'
  | 'gateAdder'
  | 'gateMul'
  | 'gateShift'
  | 'cmosGate'
  | 'mosfetPhysics';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface NavNode {
  id: NodeId;
  parentId: NodeId | null;
  sceneKey: SceneKey;
  pose: CameraPose;
  /** breadcrumb depth, derived from parent chain */
  depth: number;
}
