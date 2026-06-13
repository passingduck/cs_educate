import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html, Clone } from '@react-three/drei';
import { Label3D } from '../shared/Label3D';

const STAGES = [
  {
    pos: new THREE.Vector3(-4.6, 1.0, 0.6),
    code: 'c = a + b;',
    lang: 'C 언어 (사람의 말)',
    mono: false,
    caption: '우리가 쓰는 코드입니다. 하지만 CPU는 이 말을 전혀 못 알아들어요.',
  },
  {
    pos: new THREE.Vector3(0.8, 1.0, 0.8),
    code: 'LDR R0,[a]\nLDR R1,[b]\nADD R2,R0,R1\nSTR R2,[c]',
    lang: '어셈블리 (CPU 동작 단위)',
    mono: true,
    caption: '컴파일러가 한 줄을 "꺼내고·더하고·저장하는" 4개 명령으로 풀었습니다.',
  },
  {
    pos: new THREE.Vector3(4.6, 1.0, 0.8),
    code: '0110 0000 0000\n0110 0001 0100\n0001 0010 0001\n0111 0010 1000',
    lang: '기계어 (0과 1)',
    mono: true,
    caption: '어셈블러가 단어를 비트로 바꿨어요. 각 구간이 "동작/상자번호"를 뜻합니다.',
  },
  {
    pos: new THREE.Vector3(7.2, 0.7, 0),
    code: '⚡',
    lang: 'CPU 실행!',
    mono: false,
    caption: '이 0과 1이 메모리에 저장되고, CPU가 인출→해석→실행합니다. 번역 완료!',
  },
];

/** 코드 → 어셈블리 → 기계어 → CPU. 컴파일러/어셈블러 공장을 통과하는 카드 여행 */
export function CompilerStory() {
  const { nodes } = useGLTF('/models/factory.glb');
  const [stage, setStage] = useState(0);
  const card = useRef<THREE.Group>(null);
  const factories = useRef<THREE.Group>(null);
  const progress = useRef(1); // 1 = 도착 완료

  const next = () => {
    if (stage >= STAGES.length - 1) {
      setStage(0);
      progress.current = 0;
      card.current?.position.copy(STAGES[STAGES.length - 1].pos);
      return;
    }
    setStage(stage + 1);
    progress.current = 0;
  };

  useFrame((state, delta) => {
    if (!card.current) return;
    const target = STAGES[stage].pos;
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 0.7);
      const t = progress.current;
      card.current.position.lerp(target, 1 - Math.pow(1 - t, 3) * 0.92);
      card.current.position.y = target.y + Math.sin(t * Math.PI) * 1.0;
      // 통과 중 공장 들썩임
      if (factories.current) {
        factories.current.children.forEach((f) => {
          f.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 14)) * 0.05;
        });
      }
    } else {
      card.current.position.lerp(target, 0.1);
      if (factories.current) factories.current.children.forEach((f) => (f.position.y *= 0.8));
    }
    card.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });

  const s = STAGES[stage];

  return (
    <group>
      {/* 바닥 */}
      <mesh position={[1.2, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noHighlight: true }}>
        <planeGeometry args={[16, 7]} />
        <meshStandardMaterial color="#1b212d" roughness={0.85} />
      </mesh>

      {/* 컴파일러 / 어셈블러 공장 */}
      <group ref={factories}>
        <group position={[-1.8, 0, 0]}>
          <Clone object={nodes.factory as THREE.Object3D} />
        </group>
        <group position={[2.8, 0, 0]} scale={0.78}>
          <Clone object={nodes.factory as THREE.Object3D} />
        </group>
      </group>
      <Label3D position={[-1.8, 2.4, 0]} accent>
        컴파일러 공장
      </Label3D>
      <Label3D position={[-1.8, 2.0, 0]} small>
        사람의 말 → CPU 동작 단위
      </Label3D>
      <Label3D position={[2.8, 2.0, 0]} accent>
        어셈블러 공장
      </Label3D>
      <Label3D position={[2.8, 1.65, 0]} small>
        단어 → 0과 1
      </Label3D>

      {/* CPU 칩 (종착지) */}
      <group position={[7.2, 0, 0]}>
        <mesh position={[0, 0.25, 0]} userData={{ noHighlight: true }}>
          <boxGeometry args={[1.3, 0.5, 1.3]} />
          <meshStandardMaterial color="#2a3142" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.52, 0]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.7, 0.06, 0.7]} />
          <meshStandardMaterial color="#4cc8ff" emissive="#4cc8ff" emissiveIntensity={0.8} />
        </mesh>
        <Label3D position={[0, 1.2, 0]} accent>
          CPU
        </Label3D>
      </group>

      {/* 코드 카드 */}
      <group ref={card} position={[-4.6, 1.0, 0.6]}>
        <mesh userData={{ noHighlight: true }}>
          <boxGeometry args={[1.7, 1.15, 0.06]} />
          <meshStandardMaterial color="#e8edf5" roughness={0.4} />
        </mesh>
        <Html position={[0, 0, 0.05]} center transform scale={0.32} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              width: 320,
              textAlign: 'center',
              fontFamily: s.mono ? 'JetBrains Mono, monospace' : 'inherit',
              fontSize: s.code.length > 4 ? 22 : 64,
              fontWeight: 700,
              color: '#10151f',
              whiteSpace: 'pre-line',
              lineHeight: 1.45,
              pointerEvents: 'none',
            }}
          >
            {s.code}
          </div>
        </Html>
        <Html position={[0, -0.85, 0.05]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="label3d accent" style={{ pointerEvents: 'none' }}>{s.lang}</div>
        </Html>
      </group>

      {/* 진행 컨트롤 + 해설 */}
      <Html position={[1.2, 4.1, 0]} center zIndexRange={[5, 0]}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 460 }}>
          <div className="label3d" style={{ fontSize: 13.5, whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.5, padding: '8px 16px' }}>
            {s.caption}
          </div>
          <button
            onClick={next}
            style={{
              padding: '9px 26px',
              borderRadius: 999,
              border: '1px solid rgba(76,200,255,.4)',
              background: 'rgba(76,200,255,.15)',
              color: '#4cc8ff',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {stage >= STAGES.length - 1 ? '⟲ 처음부터' : '번역 진행 ▶'}
          </button>
        </div>
      </Html>
    </group>
  );
}

useGLTF.preload('/models/factory.glb');
