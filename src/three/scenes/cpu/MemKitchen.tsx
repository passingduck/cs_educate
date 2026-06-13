import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { Label3D } from '../shared/Label3D';

interface Station {
  key: string;
  node: string;
  pos: [number, number, number];
  scale: number;
  title: string;
  sub: string;
  beats: string;
  /** 배달 애니메이션 시간(초) — 지연시간 비유 */
  travel: number;
  beatTarget: number;
  color: string;
}

const STATIONS: Station[] = [
  { key: 'reg', node: 'pan', pos: [-5.2, 0, 0.2], scale: 1.15, title: '프라이팬 = 레지스터', sub: '조리 중인 재료', beats: '1박자', travel: 0.35, beatTarget: 1, color: '#4cc8ff' },
  { key: 'sram', node: 'table', pos: [-2.4, 0, -0.4], scale: 1.1, title: '식탁 = SRAM 캐시', sub: '곧 쓸 재료', beats: '~4박자', travel: 1.1, beatTarget: 4, color: '#7ee787' },
  { key: 'dram', node: 'fridge', pos: [0.9, 0, -0.6], scale: 1.1, title: '냉장고 = DRAM', sub: '이번 주 장본 것', beats: '~200박자', travel: 2.6, beatTarget: 200, color: '#ffb454' },
  { key: 'ssd', node: 'mart', pos: [5.8, 0, -1.2], scale: 1.15, title: '마트 = SSD', sub: '세상 모든 재료', beats: '~10만 박자', travel: 5.0, beatTarget: 100000, color: '#ff7a59' },
];

const PAN_POS = new THREE.Vector3(-5.2, 0.75, 0.2);

/** 메모리 계층 = 요리사의 주방. 저장소 클릭 → 재료가 프라이팬까지 배달되는 시간 체험 */
export function MemKitchen() {
  const { nodes } = useGLTF('/models/kitchen_set.glb');
  const [hovered, setHovered] = useState<string | null>(null);
  const anim = useRef<{ station: Station; start: number } | null>(null);
  const ingredient = useRef<THREE.Mesh>(null);
  const counter = useRef<HTMLDivElement>(null);

  const startFetch = (s: Station) => {
    anim.current = { station: s, start: performance.now() };
  };

  useFrame(() => {
    const a = anim.current;
    const mesh = ingredient.current;
    if (!mesh) return;
    if (!a) {
      mesh.visible = false;
      return;
    }
    const t = (performance.now() - a.start) / (a.station.travel * 1000);
    if (t >= 1.15) {
      anim.current = null;
      if (counter.current) counter.current.textContent = `${a.station.title.split('=')[1].trim()} 도착! ${a.station.beats} 걸렸어요`;
      return;
    }
    const p = Math.min(t, 1);
    mesh.visible = true;
    const from = new THREE.Vector3(a.station.pos[0], 1.0, a.station.pos[2]);
    mesh.position.lerpVectors(from, PAN_POS, p);
    mesh.position.y += Math.sin(p * Math.PI) * 0.8; // 포물선
    (mesh.material as THREE.MeshStandardMaterial).color.set(a.station.color);
    (mesh.material as THREE.MeshStandardMaterial).emissive.set(a.station.color);
    if (counter.current) {
      const beats = Math.round(a.station.beatTarget * p);
      counter.current.textContent = `⏱ ${beats.toLocaleString()}박자…`;
    }
  });

  return (
    <group>
      {/* 주방 바닥 */}
      <mesh position={[0.3, -0.04, -0.3]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noHighlight: true }}>
        <planeGeometry args={[15, 7]} />
        <meshStandardMaterial color="#1b212d" roughness={0.85} />
      </mesh>

      {STATIONS.map((s) => (
        <group key={s.key}>
          <group
            position={s.pos}
            scale={hovered === s.key ? s.scale * 1.08 : s.scale}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(s.key);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered((h) => (h === s.key ? null : h));
              document.body.style.cursor = 'auto';
            }}
            onClick={(e) => {
              e.stopPropagation();
              startFetch(s);
            }}
          >
            <primitive object={nodes[s.node] as THREE.Mesh} />
          </group>
          <Label3D position={[s.pos[0], 2.3, s.pos[2]]} accent={hovered === s.key}>
            {s.title}
          </Label3D>
          <Label3D position={[s.pos[0], 1.9, s.pos[2]]} small>
            {`${s.sub} · ${s.beats}`}
          </Label3D>
        </group>
      ))}

      {/* 배달 경로 (바닥 점선 느낌) */}
      {STATIONS.slice(1).map((s) => (
        <mesh
          key={s.key}
          position={[(s.pos[0] + PAN_POS.x) / 2, 0.01, (s.pos[2] + PAN_POS.z) / 2 + 0.9]}
          rotation={[-Math.PI / 2, 0, Math.atan2(s.pos[0] - PAN_POS.x, s.pos[2] - PAN_POS.z) + Math.PI / 2]}
          userData={{ noHighlight: true }}
        >
          <planeGeometry args={[Math.hypot(s.pos[0] - PAN_POS.x, s.pos[2] - PAN_POS.z), 0.04]} />
          <meshStandardMaterial color="#2c3a52" roughness={0.8} />
        </mesh>
      ))}

      {/* 배달 중인 재료 */}
      <mesh ref={ingredient} visible={false} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#7ee787" emissive="#7ee787" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>

      {/* 박자 카운터 */}
      <Html position={[0.3, 3.4, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={counter}
          className="label3d accent"
          style={{ fontSize: 15, padding: '6px 16px', pointerEvents: 'none' }}
        >
          저장소를 클릭해 재료를 가져와 보세요 🍳
        </div>
      </Html>

      <Label3D position={[0.3, -0.5, 2.2]} small>
        가까울수록 빠르고 작다 · 멀수록 느리고 크다 — 자주 쓰는 것일수록 가까이!
      </Label3D>
    </group>
  );
}

useGLTF.preload('/models/kitchen_set.glb');
