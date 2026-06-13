import type { NavNode, NodeId } from './types';

type NodeDef = Omit<NavNode, 'depth'>;

const defs: NodeDef[] = [
  {
    id: 'computer',
    parentId: null,
    sceneKey: 'computer',
    pose: { position: [5.1, 3.0, 6.8], target: [0, 0.55, 0] },
  },
  {
    id: 'motherboard',
    parentId: 'computer',
    sceneKey: 'motherboard',
    pose: { position: [0.4, 6.5, 6.0], target: [0.15, 0, 0] },
  },
  {
    id: 'ssd',
    parentId: 'motherboard',
    sceneKey: 'motherboard',
    pose: { position: [-2.4, 2.6, 4.0], target: [-2.2, 0, 1.6] },
  },
  {
    id: 'dram',
    parentId: 'motherboard',
    sceneKey: 'dramModule',
    pose: { position: [0.2, 1.9, 7.6], target: [0, 1.2, 0] },
  },
  {
    id: 'dram-array',
    parentId: 'dram',
    sceneKey: 'dramArray',
    pose: { position: [0, 7.5, 7.0], target: [0, 0, 0.4] },
  },
  {
    id: 'dram-cell',
    parentId: 'dram-array',
    sceneKey: 'dramCell',
    pose: { position: [4.2, 3.2, 5.5], target: [0, 0.9, 0] },
  },
  {
    id: 'cpu',
    parentId: 'motherboard',
    sceneKey: 'cpuDie',
    pose: { position: [0, 7.2, 5.8], target: [0, 0, 0] },
  },
  {
    id: 'cpu-boot',
    parentId: 'cpu',
    sceneKey: 'cpuDie',
    pose: { position: [-1.2, 4.6, 4.2], target: [-1.0, 0, -0.4] },
  },
  {
    id: 'cpu-regdemo',
    parentId: 'cpu',
    sceneKey: 'cpuDie',
    pose: { position: [1.4, 4.8, 4.4], target: [0.9, 0, 0.1] },
  },
  {
    id: 'compiler',
    parentId: 'cpu',
    sceneKey: 'compilerStory',
    pose: { position: [0.5, 4.0, 11.0], target: [0.5, 1.0, 0] },
  },
  {
    id: 'mem-hierarchy',
    parentId: 'cpu',
    sceneKey: 'memKitchen',
    pose: { position: [-1.0, 2.3, 7.7], target: [-0.6, 0.7, -0.3] },
  },
  {
    id: 'regfile',
    parentId: 'cpu',
    sceneKey: 'regFile',
    pose: { position: [0, 0.3, 10.5], target: [0, 0, 0] },
  },
  {
    id: 'mux',
    parentId: 'regfile',
    sceneKey: 'muxDetail',
    pose: { position: [0, 0.3, 9.0], target: [0, 0, 0] },
  },
  {
    id: 'sram-latch',
    parentId: 'cpu-regdemo',
    sceneKey: 'gateLatch',
    pose: { position: [0, 0.4, 9.5], target: [0, 0, 0] },
  },
  {
    id: 'reg-flipflop',
    parentId: 'regfile',
    sceneKey: 'gateFlipflop',
    pose: { position: [0, 0.5, 11.5], target: [0, -0.2, 0] },
  },
  {
    id: 'alu',
    parentId: 'cpu',
    sceneKey: 'aluUnits',
    pose: { position: [0, 4.2, 7.2], target: [0, 0.5, 0] },
  },
  {
    id: 'alu-add',
    parentId: 'alu',
    sceneKey: 'gateAdder',
    pose: { position: [0, 0.6, 10.5], target: [0, 0, 0] },
  },
  {
    id: 'alu-mul',
    parentId: 'alu',
    sceneKey: 'gateMul',
    pose: { position: [0, 1.0, 11.5], target: [0, 0, 0] },
  },
  {
    id: 'alu-shift',
    parentId: 'alu',
    sceneKey: 'gateShift',
    pose: { position: [0, 0.6, 10.5], target: [0, 0, 0] },
  },
  {
    id: 'cmos',
    parentId: 'alu-add',
    sceneKey: 'cmosGate',
    pose: { position: [0, 0.4, 9.5], target: [0, 0.2, 0] },
  },
  {
    id: 'mosfet',
    parentId: 'cmos',
    sceneKey: 'mosfetPhysics',
    pose: { position: [5.2, 3.6, 7.5], target: [0, 0.4, 0] },
  },
];

function buildTree(): Record<NodeId, NavNode> {
  const byId = Object.fromEntries(defs.map((d) => [d.id, d])) as Record<NodeId, NodeDef>;
  const depthOf = (id: NodeId): number => {
    let d = 0;
    let cur = byId[id];
    while (cur.parentId) {
      d += 1;
      cur = byId[cur.parentId];
    }
    return d;
  };
  return Object.fromEntries(
    defs.map((d) => [d.id, { ...d, depth: depthOf(d.id) }]),
  ) as Record<NodeId, NavNode>;
}

export const NAV_TREE = buildTree();

/** root → … → id 경로 (breadcrumb용) */
export function pathOf(id: NodeId): NodeId[] {
  const path: NodeId[] = [];
  let cur: NavNode | null = NAV_TREE[id];
  while (cur) {
    path.unshift(cur.id);
    cur = cur.parentId ? NAV_TREE[cur.parentId] : null;
  }
  return path;
}
