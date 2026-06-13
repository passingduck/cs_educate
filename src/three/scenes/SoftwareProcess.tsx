import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { Selectable } from '../Selectable';
import { Label3D } from './shared/Label3D';
import type { NodeId } from '../../nav/types';

type Vec3 = [number, number, number];

const MEMORY = [
  {
    key: 'code',
    label: 'CODE',
    title: '실행할 명령',
    note: 'agent.py와 라이브러리 코드. 보통 읽기 전용.',
    color: '#5aa2ff',
    y: 1.78,
    h: 0.66,
    nodeId: 'cpu-boot',
  },
  {
    key: 'data',
    label: 'DATA',
    title: '처음부터 있는 값',
    note: 'API 주소, 모델 이름, 설정값, 전역 변수.',
    color: '#7ee787',
    y: 0.9,
    h: 0.52,
    nodeId: 'dram',
  },
  {
    key: 'heap',
    label: 'HEAP',
    title: '실행 중 커지는 공간',
    note: '대화 기록, JSON, tool 결과, 생성된 객체.',
    color: '#ffb454',
    y: -0.02,
    h: 0.74,
    nodeId: 'dram',
  },
  {
    key: 'stack',
    label: 'STACK',
    title: '지금 호출 중인 함수',
    note: 'run_agent → call_model → tool_call 순서의 임시 메모장.',
    color: '#ff7a59',
    y: -1.0,
    h: 0.58,
    nodeId: 'regfile',
  },
] as const;

const HARDWARE: { label: string; nodeId: NodeId; position: Vec3; color: string; note: string }[] = [
  { label: 'SSD', nodeId: 'ssd', position: [-3.78, -2.35, 0], color: '#aab4c0', note: '파일로 저장' },
  { label: 'DRAM', nodeId: 'dram', position: [-2.58, -2.35, 0], color: '#7ee787', note: '프로세스가 올라감' },
  { label: 'CPU', nodeId: 'cpu-regdemo', position: [-1.38, -2.35, 0], color: '#5aa2ff', note: '한 줄씩 실행' },
  { label: 'REG', nodeId: 'regfile', position: [-0.26, -2.35, 0], color: '#ff7a59', note: '지금 쓰는 값' },
];

function SourcePanel() {
  return (
    <group position={[-4.55, 0.52, 0]}>
      <RoundedBox args={[2.45, 2.9, 0.12]} radius={0.08} smoothness={4} userData={{ noHighlight: true }}>
        <meshStandardMaterial color="#e8edf5" roughness={0.36} />
      </RoundedBox>
      <Html position={[0, 0, 0.08]} center transform distanceFactor={4.9} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
        <div className="software-source-card">
          <div className="source-title">agent.py</div>
          <pre>{`messages = []

def run_agent(task):
    messages.append(task)
    plan = call_model(messages)
    result = run_tool(plan)
    messages.append(result)
    return result`}</pre>
        </div>
      </Html>
      <Label3D position={[0, 1.75, 0]} accent>
        AI agent 코드
      </Label3D>
      <Label3D position={[0, -1.76, 0]} small>
        사람이 읽는 코드가 실행 파일과 데이터로 바뀝니다
      </Label3D>
    </group>
  );
}

function MemoryTower() {
  return (
    <group position={[-1.62, 0.32, 0]}>
      <RoundedBox args={[2.52, 3.56, 0.18]} radius={0.08} smoothness={4} userData={{ noHighlight: true }}>
        <meshStandardMaterial color="#141b2a" roughness={0.72} metalness={0.1} />
      </RoundedBox>
      <Label3D position={[0, 2.18, 0]} accent>
        프로세스 주소 공간
      </Label3D>
      {MEMORY.map((section) => (
        <Selectable key={section.key} nodeId={section.nodeId} position={[0, section.y, 0.16]}>
          <RoundedBox args={[2.22, section.h, 0.24]} radius={0.06} smoothness={4}>
            <meshStandardMaterial
              color={section.color}
              emissive={section.color}
              emissiveIntensity={0.2}
              roughness={0.42}
              metalness={0.2}
            />
          </RoundedBox>
          <Html position={[0, 0, 0.18]} center transform distanceFactor={4.6} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
            <div className="memory-section-card">
              <div>
                <b>{section.label}</b>
                <em>{section.title}</em>
              </div>
              <span>{section.note}</span>
            </div>
          </Html>
        </Selectable>
      ))}
      <mesh position={[1.52, -0.48, 0.18]} rotation={[0, 0, -0.1]} userData={{ noHighlight: true }}>
        <coneGeometry args={[0.11, 0.42, 24]} />
        <meshStandardMaterial color="#ffb454" emissive="#ffb454" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[1.52, -0.76, 0.18]} rotation={[0, 0, Math.PI + 0.1]} userData={{ noHighlight: true }}>
        <coneGeometry args={[0.11, 0.42, 24]} />
        <meshStandardMaterial color="#ff7a59" emissive="#ff7a59" emissiveIntensity={0.8} />
      </mesh>
      <Label3D position={[1.55, -0.62, 0]} small>
        heap은 커지고, stack은 호출이 끝나면 줄어듭니다
      </Label3D>
    </group>
  );
}

function HardwareNode({ label, nodeId, position, color, note }: (typeof HARDWARE)[number]) {
  return (
    <Selectable nodeId={nodeId} position={position}>
      <RoundedBox args={[1.0, 0.46, 0.42]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.34} metalness={0.3} />
      </RoundedBox>
      <Label3D position={[0, 0.54, 0]} accent>
        {label}
      </Label3D>
      <Label3D position={[0, -0.56, 0]} small>
        {note}
      </Label3D>
    </Selectable>
  );
}

function HardwareShelf() {
  return (
    <group>
      <mesh position={[-2.02, -2.35, -0.08]} userData={{ noHighlight: true }}>
        <boxGeometry args={[4.6, 0.08, 0.18]} />
        <meshStandardMaterial color="#243149" emissive="#243149" emissiveIntensity={0.35} />
      </mesh>
      {HARDWARE.map((item) => (
        <HardwareNode key={item.label} {...item} />
      ))}
      <Label3D position={[-2.02, -3.02, 0]} small>
        아래 칩을 누르면 컴퓨터 탭의 실제 하드웨어 설명으로 이동합니다
      </Label3D>
    </group>
  );
}

function ExecutionLoop() {
  const cpu = useRef<THREE.Group>(null);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (cpu.current) cpu.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    if (!pulses.current) return;
    const points: Vec3[] = [
      [-3.95, 0.8, 0.35],
      [-2.5, 0.8, 0.35],
      [-1.62, 0.9, 0.35],
      [-2.58, -1.7, 0.35],
      [-1.38, -1.7, 0.35],
      [-0.26, -1.7, 0.35],
    ];
    for (let i = 0; i < 14; i++) {
      const t = (state.clock.elapsedTime * 0.23 + i / 14) % 1;
      const segment = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
      const local = t * (points.length - 1) - segment;
      const a = points[segment];
      const b = points[segment + 1];
      dummy.position.set(
        THREE.MathUtils.lerp(a[0], b[0], local),
        THREE.MathUtils.lerp(a[1], b[1], local),
        THREE.MathUtils.lerp(a[2], b[2], local),
      );
      dummy.scale.setScalar(0.7 + Math.sin(t * Math.PI) * 0.25);
      dummy.updateMatrix();
      pulses.current.setMatrixAt(i, dummy.matrix);
    }
    pulses.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={cpu}>
      <instancedMesh ref={pulses} args={[undefined, undefined, 14]} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial color="#4cc8ff" emissive="#4cc8ff" emissiveIntensity={1.8} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function AgentLoopBadges() {
  return (
    <group position={[-0.34, 0.58, 0]}>
      <Label3D position={[0, 1.62, 0]} accent>
        실행 루프
      </Label3D>
      {[
        ['1. 명령 읽기', '#5aa2ff'],
        ['2. 데이터 가져오기', '#7ee787'],
        ['3. 계산 / tool 호출', '#ffb454'],
        ['4. 결과 저장', '#ff7a59'],
      ].map(([text, color], i) => (
        <group key={text} position={[0, 0.92 - i * 0.5, 0]}>
          <RoundedBox args={[1.72, 0.34, 0.14]} radius={0.08} smoothness={4} userData={{ noHighlight: true }}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.45} />
          </RoundedBox>
          <Label3D position={[0, 0, 0.12]} small>
            {text}
          </Label3D>
        </group>
      ))}
    </group>
  );
}

export function SoftwareProcess() {
  return (
    <group>
      <mesh position={[-2.24, -0.26, -0.16]} userData={{ noHighlight: true }}>
        <boxGeometry args={[6.7, 0.08, 3.4]} />
        <meshStandardMaterial color="#151d2d" roughness={0.84} metalness={0.1} />
      </mesh>
      <SourcePanel />
      <MemoryTower />
      <AgentLoopBadges />
      <HardwareShelf />
      <ExecutionLoop />
    </group>
  );
}
