import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Clone, Html, useGLTF } from '@react-three/drei';
import { Selectable } from '../Selectable';
import { Label3D } from './shared/Label3D';
import { COLORS } from '../materials';
import { useNavStore } from '../../nav/useNavStore';
import type { NodeId } from '../../nav/types';

const BLOCKS = [
  {
    key: 'code',
    title: 'CODE',
    ko: '명령어',
    color: '#5aa2ff',
    y: 2.25,
    h: 0.72,
    primary: 'cpu-boot',
    why: '읽기 전용이라 ROM/SSD에 보관하기 좋고, 실행 중 DRAM/SRAM에서도 읽힙니다.',
    links: [
      ['ROM 부팅', 'cpu-boot'],
      ['SSD 저장', 'ssd'],
      ['SRAM 실행', 'cpu-regdemo'],
    ],
  },
  {
    key: 'data',
    title: 'DATA',
    ko: '전역 변수',
    color: '#7ee787',
    y: 1.28,
    h: 0.58,
    primary: 'dram',
    why: '값이 바뀌는 전역/정적 데이터라 실행 중 DRAM에 놓이고 CPU 근처 캐시로 올라옵니다.',
    links: [
      ['DRAM', 'dram'],
      ['CPU 캐시', 'cpu-regdemo'],
      ['레지스터', 'regfile'],
    ],
  },
  {
    key: 'heap',
    title: 'HEAP',
    ko: '동적 할당',
    color: '#ffb454',
    y: 0.28,
    h: 0.7,
    primary: 'dram',
    why: 'malloc/new처럼 실행 중 크기가 변하므로 넓은 DRAM 공간에서 관리됩니다.',
    links: [
      ['DRAM', 'dram'],
      ['SSD swap', 'ssd'],
      ['메모리 계층', 'mem-hierarchy'],
    ],
  },
  {
    key: 'stack',
    title: 'STACK',
    ko: '함수 호출',
    color: '#ff7a59',
    y: -0.84,
    h: 0.84,
    primary: 'regfile',
    why: '함수 호출마다 빠르게 쌓이고 사라집니다. 본체는 DRAM, 맨 위 값은 레지스터/캐시에 자주 올라옵니다.',
    links: [
      ['레지스터', 'regfile'],
      ['SRAM 캐시', 'cpu-regdemo'],
      ['DRAM', 'dram'],
    ],
  },
] as const;

const HW_LINKS: { label: string; nodeId: NodeId; x: number; color: string; note: string }[] = [
  { label: 'ROM', nodeId: 'cpu-boot', x: -2.8, color: '#5aa2ff', note: '초기 code' },
  { label: 'SSD', nodeId: 'ssd', x: -1.4, color: '#aab4c0', note: '파일 보관' },
  { label: 'DRAM', nodeId: 'dram', x: 0.05, color: '#7ee787', note: '프로세스 본체' },
  { label: 'SRAM', nodeId: 'cpu-regdemo', x: 1.55, color: '#ffb454', note: '캐시' },
  { label: 'REG', nodeId: 'regfile', x: 2.9, color: '#ff7a59', note: '지금 쓰는 값' },
];

function CodeCard() {
  return (
    <group position={[-4.55, 1.25, 0]}>
      <mesh userData={{ noHighlight: true }}>
        <boxGeometry args={[2.15, 2.45, 0.12]} />
        <meshStandardMaterial color="#e8edf5" roughness={0.34} />
      </mesh>
      <Html position={[0, 0, 0.08]} center transform distanceFactor={4.8} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
        <div className="software-code-card">
          <div className="code-title">main.c</div>
          <pre>{`int global = 7;

int main() {
  int local = 3;
  int *buf = malloc(64);
  return global + local;
}`}</pre>
        </div>
      </Html>
    </group>
  );
}

function WikiChip3D({ label, nodeId }: { label: string; nodeId: NodeId }) {
  const navigateTo = useNavStore((s) => s.navigateTo);
  return (
    <button
      className="wiki-chip-3d"
      onClick={(e) => {
        e.stopPropagation();
        navigateTo(nodeId);
      }}
    >
      {label}
    </button>
  );
}

function CompilerFactory() {
  const { nodes } = useGLTF('/models/factory.glb');
  const factory = useRef<THREE.Group>(null);
  const gearA = useRef<THREE.Mesh>(null);
  const gearB = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    factory.current?.position.setY(Math.sin(state.clock.elapsedTime * 1.2) * 0.035);
    if (gearA.current) gearA.current.rotation.z += delta * 1.8;
    if (gearB.current) gearB.current.rotation.z -= delta * 2.2;
  });

  return (
    <group ref={factory} position={[-1.85, 1.0, 0]} scale={0.66}>
      <Clone object={nodes.factory as THREE.Object3D} />
      <mesh ref={gearA} position={[-0.42, 0.08, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.035, 10, 18]} />
        <meshStandardMaterial color="#d4a843" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh ref={gearB} position={[0.05, 0.06, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.03, 10, 18]} />
        <meshStandardMaterial color="#c3cad4" metalness={0.85} roughness={0.22} />
      </mesh>
    </group>
  );
}

function FlowPulses() {
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    refs.current.forEach((m, i) => {
      const t = (state.clock.elapsedTime * 0.33 + i * 0.25) % 1;
      const x = -3.65 + t * 5.85;
      const wave = Math.sin(t * Math.PI);
      m.position.set(x, 1.28 + wave * 0.22, 0.22);
      m.scale.setScalar(0.85 + wave * 0.35);
    });
  });
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} userData={{ noHighlight: true }}>
          <sphereGeometry args={[0.085, 18, 18]} />
          <meshStandardMaterial color={COLORS.accent} emissive={COLORS.accent} emissiveIntensity={1.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function ProcessBlock({ block, index }: { block: (typeof BLOCKS)[number]; index: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const phase = state.clock.elapsedTime * 1.4 + index * 0.8;
    if (mat.current) mat.current.emissiveIntensity = 0.18 + (Math.sin(phase) + 1) * 0.08;
    if (group.current) group.current.position.x = Math.sin(phase * 0.55) * 0.025;
  });

  return (
    <Selectable nodeId={block.primary} position={[0.05, block.y, 0]}>
      <group ref={group}>
        <mesh>
          <boxGeometry args={[2.18, block.h, 0.34]} />
          <meshStandardMaterial
            ref={mat}
            color={block.color}
            emissive={block.color}
            emissiveIntensity={0.24}
            roughness={0.34}
            metalness={0.25}
          />
        </mesh>
        <mesh position={[-1.34, 0, 0.21]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.09, block.h * 0.78, 0.08]} />
          <meshStandardMaterial color="#e8edf5" emissive={block.color} emissiveIntensity={0.45} />
        </mesh>
        <Html position={[0, 0, 0.25]} center transform distanceFactor={4.2} zIndexRange={[4, 0]}>
          <div className="process-block-card">
            <div className="process-block-head">
              <span>{block.title}</span>
              <em>{block.ko}</em>
            </div>
            <p>{block.why}</p>
            <div className="wiki-chip-row">
              {block.links.map(([label, nodeId]) => (
                <WikiChip3D key={nodeId} label={label} nodeId={nodeId} />
              ))}
            </div>
          </div>
        </Html>
      </group>
    </Selectable>
  );
}

function HardwareRail() {
  return (
    <group position={[-1.75, -1.9, 0]}>
      <mesh position={[0, -0.22, -0.02]} userData={{ noHighlight: true }}>
        <boxGeometry args={[6.65, 0.05, 0.12]} />
        <meshStandardMaterial color="#223147" emissive="#223147" emissiveIntensity={0.3} />
      </mesh>
      {HW_LINKS.map((h) => (
        <Selectable key={h.nodeId} nodeId={h.nodeId} position={[h.x, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.34, 0.34, 0.2, 28]} />
            <meshStandardMaterial color={h.color} emissive={h.color} emissiveIntensity={0.28} metalness={0.35} roughness={0.35} />
          </mesh>
          <Label3D position={[0, 0.55, 0]} small>
            {h.label}
          </Label3D>
          <Label3D position={[0, -0.55, 0]} small>
            {h.note}
          </Label3D>
        </Selectable>
      ))}
    </group>
  );
}

export function SoftwareProcess() {
  return (
    <group>
      <mesh position={[-1.45, -0.18, -0.08]} userData={{ noHighlight: true }}>
        <boxGeometry args={[8.6, 0.08, 3.25]} />
        <meshStandardMaterial color="#182033" roughness={0.82} metalness={0.1} />
      </mesh>

      <CodeCard />
      <CompilerFactory />
      <FlowPulses />

      <Label3D position={[-4.55, 2.75, 0]} accent>
        C 언어 소스
      </Label3D>
      <Label3D position={[-1.85, 2.55, 0]} accent>
        컴파일러
      </Label3D>
      <Label3D position={[0.05, 2.78, 0]} accent>
        프로세스 메모리 레이아웃
      </Label3D>

      <group>
        {BLOCKS.map((block, index) => (
          <ProcessBlock key={block.key} block={block} index={index} />
        ))}
      </group>

      <mesh position={[1.38, -0.33, 0.22]} rotation={[0, 0, -0.15]} userData={{ noHighlight: true }}>
        <coneGeometry args={[0.13, 0.52, 24]} />
        <meshStandardMaterial color="#ff7a59" emissive="#ff7a59" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[1.15, 0.7, 0.22]} rotation={[0, 0, 0.16]} userData={{ noHighlight: true }}>
        <coneGeometry args={[0.13, 0.52, 24]} />
        <meshStandardMaterial color="#ffb454" emissive="#ffb454" emissiveIntensity={0.8} />
      </mesh>
      <Label3D position={[1.45, 0.15, 0]} small>
        heap은 위로, stack은 아래로 자라며 서로 충돌하면 메모리 부족
      </Label3D>

      <HardwareRail />
      <Label3D position={[-1.75, -2.8, 0]} small>
        각 하드웨어 노드를 클릭하면 컴퓨터 탭의 해당 위치로 이동합니다
      </Label3D>
    </group>
  );
}

useGLTF.preload('/models/factory.glb');
