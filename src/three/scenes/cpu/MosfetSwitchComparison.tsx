import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Label3D } from '../shared/Label3D';

const ON = '#7ee787';
const OFF = '#3b4250';
const BLUE = '#5aa2ff';
const RED = '#ff7a59';
const AMBER = '#ffb454';

function InputPad({
  position,
  on,
  onToggle,
  label,
}: {
  position: [number, number, number];
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <group position={position}>
      <RoundedBox
        args={[1.0, 0.42, 0.12]}
        radius={0.08}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={on ? ON : OFF}
          emissive={on ? ON : '#000000'}
          emissiveIntensity={on ? 0.9 : 0}
          roughness={0.35}
          metalness={0.2}
        />
      </RoundedBox>
      <Label3D position={[0, 0.52, 0]} small>
        {`${label}: ${on ? '1 / 열기' : '0 / 닫기'} — 클릭`}
      </Label3D>
    </group>
  );
}

function SignalDots({ on, speed, y = 0, z = 0 }: { on: boolean; speed: number; y?: number; z?: number }) {
  const dots = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());

  useFrame((state) => {
    if (!dots.current) return;
    dots.current.visible = on;
    if (!on) return;
    for (let i = 0; i < 10; i++) {
      const t = ((state.clock.elapsedTime * speed + i / 10) % 1) * 2.2 - 1.1;
      dummy.current.position.set(t, y, z);
      dummy.current.scale.setScalar(0.8 + Math.sin((t + 1.1) * Math.PI) * 0.25);
      dummy.current.updateMatrix();
      dots.current.setMatrixAt(i, dummy.current.matrix);
    }
    dots.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={dots} args={[undefined, undefined, 10]} visible={false} userData={{ noHighlight: true }}>
      <sphereGeometry args={[0.055, 10, 10]} />
      <meshStandardMaterial color={ON} emissive={ON} emissiveIntensity={1.8} toneMapped={false} />
    </instancedMesh>
  );
}

function HumanSwitch({ input }: { input: boolean }) {
  const [reported, setReported] = useState(false);
  const [mistake, setMistake] = useState(false);
  const timer = useRef<number | null>(null);
  const group = useRef<THREE.Group>(null);
  const lastInput = useRef(input);

  useFrame((state) => {
    if (input !== lastInput.current) {
      lastInput.current = input;
      if (timer.current !== null) window.clearTimeout(timer.current);
      setMistake(false);
      timer.current = window.setTimeout(() => {
        const shouldMistake = input && Math.floor(state.clock.elapsedTime * 10) % 5 === 0;
        setReported(shouldMistake ? !input : input);
        setMistake(shouldMistake);
      }, 620);
    }
    if (group.current) group.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.2) * 0.025;
  });

  return (
    <group ref={group} position={[-4.35, 0.15, 0]}>
      <Label3D position={[0, 2.35, 0]} accent>
        사람 스위치
      </Label3D>
      <Label3D position={[0, -1.7, 0]} small>
        느림 · 피곤하면 실수
      </Label3D>

      <mesh position={[0, 0.16, 0]} userData={{ noHighlight: true }}>
        <capsuleGeometry args={[0.3, 0.96, 8, 16]} />
        <meshStandardMaterial color="#6f88a8" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.98, 0]} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.24, 18, 18]} />
        <meshStandardMaterial color="#d8b08a" roughness={0.42} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, -0.74, 0]} rotation={[0, 0, x > 0 ? -0.2 : 0.2]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.13, 0.72, 0.13]} />
          <meshStandardMaterial color="#2d3644" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[-0.42, 0.6, 0]} rotation={[0, 0, reported ? 0.85 : -0.35]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.1, 0.9, 0.1]} />
        <meshStandardMaterial color="#b8c3d1" roughness={0.35} />
      </mesh>
      <mesh position={[-0.75, reported ? 1.05 : 0.33, 0]} rotation={[0, 0, reported ? 0.85 : -0.35]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.52, 0.34, 0.04]} />
        <meshStandardMaterial
          color={reported ? BLUE : RED}
          emissive={reported ? BLUE : RED}
          emissiveIntensity={0.35}
          roughness={0.42}
        />
      </mesh>
      <SignalDots on={reported} speed={0.45} y={-1.1} />
      <mesh position={[0, -1.1, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[2.3, 0.08, 0.08]} />
        <meshStandardMaterial color={reported ? ON : OFF} emissive={reported ? ON : '#000000'} emissiveIntensity={reported ? 0.45 : 0} />
      </mesh>
      <Label3D position={[0, 1.55, 0]} small>
        {mistake ? '앗, 반대로 들었습니다' : reported === input ? '보고 따라 하는 중' : '반응 대기 중...'}
      </Label3D>
    </group>
  );
}

function VacuumTubeSwitch({ input }: { input: boolean }) {
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const plate = useRef<THREE.Mesh>(null);
  const warm = useRef(0);
  const conductingRef = useRef(false);
  const [conducting, setConducting] = useState(false);

  useFrame((state, delta) => {
    warm.current = THREE.MathUtils.clamp(warm.current + (input ? delta * 1.2 : -delta * 0.75), 0, 1);
    if (glow.current) glow.current.emissiveIntensity = 0.25 + warm.current * 1.6 + Math.sin(state.clock.elapsedTime * 9) * 0.08;
    if (plate.current) plate.current.rotation.y += delta * 0.35;
    const nextConducting = warm.current > 0.65;
    if (conductingRef.current !== nextConducting) {
      conductingRef.current = nextConducting;
      setConducting(nextConducting);
    }
  });

  return (
    <group position={[-2.18, 0.15, 0]}>
      <Label3D position={[0, 2.35, 0]} accent>
        진공관 스위치
      </Label3D>
      <Label3D position={[0, -1.7, 0]} small>
        가능하지만 큼 · 뜨거움 · 전력 큼
      </Label3D>

      <mesh position={[0, 0.35, 0]} userData={{ noHighlight: true }}>
        <cylinderGeometry args={[0.58, 0.72, 2.35, 36]} />
        <meshPhysicalMaterial color="#cfe6ff" transparent opacity={0.28} roughness={0.04} clearcoat={1} clearcoatRoughness={0.02} />
      </mesh>
      <mesh position={[0, -0.95, 0]} userData={{ noHighlight: true }}>
        <cylinderGeometry args={[0.55, 0.65, 0.24, 36]} />
        <meshStandardMaterial color="#4e5664" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh ref={plate} position={[0, 0.48, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.5, 1.24, 0.08]} />
        <meshStandardMaterial color="#9aa7b8" metalness={0.8} roughness={0.24} />
      </mesh>
      <mesh position={[0, -0.18, 0]} userData={{ noHighlight: true }}>
        <torusGeometry args={[0.28, 0.03, 10, 28]} />
        <meshStandardMaterial
          ref={glow}
          color={AMBER}
          emissive={AMBER}
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </mesh>
      <SignalDots on={conducting} speed={0.8} y={0.36} />
      <mesh position={[0, -1.1, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[2.3, 0.08, 0.08]} />
        <meshStandardMaterial color={conducting ? ON : OFF} emissive={conducting ? ON : '#000000'} emissiveIntensity={conducting ? 0.45 : 0} />
      </mesh>
      <Label3D position={[0, 1.65, 0]} small>
        {input ? '필라멘트 예열 후 전자 흐름' : '식는 중...'}
      </Label3D>
    </group>
  );
}

function MosfetSwitch({ input }: { input: boolean }) {
  const channel = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    progress.current = THREE.MathUtils.clamp(progress.current + (input ? delta * 7 : -delta * 7), 0, 1);
    const p = progress.current;
    if (channel.current && mat.current) {
      channel.current.visible = p > 0.02;
      channel.current.scale.x = Math.max(0.01, p);
      mat.current.opacity = p * 0.92;
      mat.current.emissiveIntensity = p * 1.8;
    }
  });

  return (
    <group position={[-0.16, 0.15, 0]}>
      <Label3D position={[0, 2.35, 0]} accent>
        MOSFET 스위치
      </Label3D>
      <Label3D position={[0, -1.7, 0]} small>
        작음 · 빠름 · 정확함 · 대량 복사
      </Label3D>

      <RoundedBox args={[2.4, 1.0, 1.15]} radius={0.07} smoothness={4} position={[0, 0, 0]} userData={{ noHighlight: true }}>
        <meshStandardMaterial color="#2c3a52" roughness={0.35} metalness={0.12} />
      </RoundedBox>
      {[-0.8, 0.8].map((x) => (
        <RoundedBox key={x} args={[0.55, 0.42, 1.0]} radius={0.05} smoothness={4} position={[x, 0.36, 0]} userData={{ noHighlight: true }}>
          <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.24} roughness={0.36} metalness={0.18} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.72, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[1.0, 0.07, 1.05]} />
        <meshPhysicalMaterial color="#eaf2ff" roughness={0.08} transparent opacity={0.48} clearcoat={1} />
      </mesh>
      <RoundedBox args={[1.0, 0.25, 1.05]} radius={0.04} smoothness={4} position={[0, 0.95, 0]} userData={{ noHighlight: true }}>
        <meshStandardMaterial color="#d4a843" emissive={input ? AMBER : '#000000'} emissiveIntensity={input ? 0.8 : 0} metalness={0.88} roughness={0.22} />
      </RoundedBox>
      <mesh ref={channel} position={[0, 0.52, 0]} visible={false} userData={{ noHighlight: true }}>
        <boxGeometry args={[1.18, 0.08, 0.95]} />
        <meshStandardMaterial ref={mat} color={ON} emissive={ON} transparent opacity={0} toneMapped={false} />
      </mesh>
      <SignalDots on={input} speed={2.6} y={0.53} />
      <mesh position={[0, -1.1, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[2.3, 0.08, 0.08]} />
        <meshStandardMaterial color={input ? ON : OFF} emissive={input ? ON : '#000000'} emissiveIntensity={input ? 0.55 : 0} />
      </mesh>
      <Label3D position={[0, 1.55, 0]} small>
        {input ? '전기장으로 채널 즉시 형성' : '채널 없음 — 차단'}
      </Label3D>
    </group>
  );
}

export function MosfetSwitchComparison() {
  const [input, setInput] = useState(true);

  return (
    <group>
      <InputPad position={[-2.18, 2.78, 0]} on={input} onToggle={() => setInput(!input)} label="공통 입력 신호" />
      <HumanSwitch input={input} />
      <VacuumTubeSwitch input={input} />
      <MosfetSwitch input={input} />
      <Label3D position={[-2.18, -2.45, 0]} small>
        모두 스위치 역할은 가능하지만, 컴퓨터는 수십억 개를 빠르고 정확하게 복사해야 해서 MOSFET을 씁니다
      </Label3D>
    </group>
  );
}
