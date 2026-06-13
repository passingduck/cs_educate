import { useGLTF, Clone } from '@react-three/drei';
import type * as THREE from 'three';
import { Selectable } from '../Selectable';
import { Label3D } from './shared/Label3D';
import { COLORS } from '../materials';

/** PCB 위 구리 트레이스 (얇고 납작한 직사각형) */
function Trace({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, 0.005, (from[1] + to[1]) / 2]}
      rotation={[0, angle, 0]}
      userData={{ noHighlight: true }}
    >
      <boxGeometry args={[0.035, 0.012, len]} />
      <meshStandardMaterial color={COLORS.copper} metalness={0.85} roughness={0.35} />
    </mesh>
  );
}

/** 케이스 내부: 메인보드 + CPU/DRAM/SSD (CPU 패키지·DIMM은 Blender GLB) */
export function Level1Motherboard() {
  const cpuGltf = useGLTF('/models/cpu_package.glb');
  const dimmGltf = useGLTF('/models/dimm.glb');
  return (
    <group>
      {/* PCB 기판 + 마운트 홀 */}
      <mesh position={[0, -0.08, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[7, 0.16, 5.2]} />
        <meshStandardMaterial color={COLORS.pcb} roughness={0.55} metalness={0.15} />
      </mesh>
      {([[-3.3, -2.4], [3.3, -2.4], [-3.3, 2.4], [3.3, 2.4]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.01, z]} userData={{ noHighlight: true }}>
          <cylinderGeometry args={[0.09, 0.09, 0.18, 16]} />
          <meshStandardMaterial color="#8a9099" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}

      {/* 버스 트레이스 다발: CPU↔DRAM, CPU↔칩셋, 칩셋↔SSD */}
      {[-0.12, 0, 0.12].map((o, i) => (
        <Trace key={`a${i}`} from={[-0.05, -0.8 + o]} to={[2.05, -0.8 + o]} />
      ))}
      {[-0.12, 0, 0.12].map((o, i) => (
        <Trace key={`b${i}`} from={[-0.6 + o, -0.05]} to={[0.7 + o, 1.1]} />
      ))}
      {[-0.1, 0.1].map((o, i) => (
        <Trace key={`c${i}`} from={[0.55 + o, 1.55]} to={[-1.5 + o, 1.75]} />
      ))}

      {/* ===== CPU: 소켓 + 패키지 + IHS ===== */}
      <group position={[-0.8, 0, -0.8]}>
        {/* 소켓 프레임 */}
        <mesh position={[0, 0.05, 0]} userData={{ noHighlight: true }}>
          <boxGeometry args={[1.85, 0.1, 1.85]} />
          <meshStandardMaterial color="#11141a" roughness={0.75} />
        </mesh>
        {/* 고정 레버 */}
        <mesh position={[1.0, 0.1, 0.6]} rotation={[0, 0, 0.25]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.06, 0.06, 0.7]} />
          <meshStandardMaterial color="#8a9099" metalness={0.8} roughness={0.35} />
        </mesh>
        <Selectable nodeId="cpu">
          {/* Blender 제작 CPU 패키지 (기판+골드 패드+십자 IHS) */}
          <Clone object={cpuGltf.nodes.cpu_package as THREE.Object3D} position={[0, 0.04, 0]} />
        </Selectable>
      </group>
      <Label3D position={[-0.8, 0.95, -0.8]} accent>
        CPU
      </Label3D>

      {/* VRM 히트싱크 (CPU 왼쪽 전원부) */}
      <group position={[-2.6, 0, -0.8]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0, 0.3, -0.62 + i * 0.25]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.5, 0.55, 0.1]} />
            <meshStandardMaterial color="#3c434e" metalness={0.75} roughness={0.35} />
          </mesh>
        ))}
        <Label3D position={[0, 0.85, 0]} small>
          전원부 (VRM)
        </Label3D>
      </group>

      {/* ===== DRAM DIMM x2 — 슬롯 + 노치 + 칩 8개 ===== */}
      <Selectable nodeId="dram" position={[2.3, 0, -0.2]}>
        {[0, 0.5].map((dx, i) => (
          <group key={i} position={[dx, 0, 0]}>
            {/* 슬롯 (래치 포함) */}
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[0.2, 0.14, 2.9]} />
              <meshStandardMaterial color="#11141a" roughness={0.8} />
            </mesh>
            {[-1.5, 1.5].map((z, j) => (
              <mesh key={j} position={[0, 0.2, z]}>
                <boxGeometry args={[0.16, 0.28, 0.14]} />
                <meshStandardMaterial color="#1c2027" roughness={0.7} />
              </mesh>
            ))}
            {/* Blender 제작 DIMM (PCB+칩 8개+골드 핑거) */}
            <Clone object={dimmGltf.nodes.dimm as THREE.Object3D} position={[0, 0.1, 0]} />
          </group>
        ))}
      </Selectable>
      <Label3D position={[2.55, 1.75, -0.2]} accent>
        DRAM
      </Label3D>

      {/* ===== SSD (M.2 2280) ===== */}
      <Selectable nodeId="ssd" position={[-2.2, 0, 1.75]}>
        {/* M.2 슬롯 */}
        <mesh position={[1.05, 0.07, 0]}>
          <boxGeometry args={[0.18, 0.14, 0.5]} />
          <meshStandardMaterial color="#11141a" roughness={0.8} />
        </mesh>
        {/* 기판 */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[1.9, 0.05, 0.58]} />
          <meshStandardMaterial color="#0f2438" roughness={0.5} />
        </mesh>
        {/* 컨트롤러(정사각) + 낸드 2개(직사각) */}
        <mesh position={[0.62, 0.15, 0]}>
          <boxGeometry args={[0.34, 0.05, 0.34]} />
          <meshStandardMaterial color={COLORS.chipLight} roughness={0.4} metalness={0.3} />
        </mesh>
        {[-0.62, -0.08].map((x, i) => (
          <mesh key={i} position={[x, 0.15, 0]}>
            <boxGeometry args={[0.44, 0.05, 0.44]} />
            <meshStandardMaterial color={COLORS.chip} roughness={0.4} metalness={0.3} />
          </mesh>
        ))}
        {/* 고정 나사 */}
        <mesh position={[-0.88, 0.12, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
          <meshStandardMaterial color="#8a9099" metalness={0.85} roughness={0.3} />
        </mesh>
      </Selectable>
      <Label3D position={[-2.2, 0.7, 1.75]} accent>
        SSD
      </Label3D>

      {/* 칩셋 + 방열판 */}
      <group position={[0.9, 0, 1.4]}>
        <mesh position={[0, 0.08, 0]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.7, 0.1, 0.7]} />
          <meshStandardMaterial color={COLORS.chip} roughness={0.4} metalness={0.3} />
        </mesh>
        {Array.from({ length: 4 }, (_, i) => (
          <mesh key={i} position={[0, 0.2, -0.24 + i * 0.16]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.62, 0.12, 0.07]} />
            <meshStandardMaterial color="#39404b" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
        <Label3D position={[0, 0.55, 0]} small>
          칩셋
        </Label3D>
      </group>

      {/* PCIe x16 슬롯 */}
      <mesh position={[-0.5, 0.06, 2.35]} userData={{ noHighlight: true }}>
        <boxGeometry args={[3.4, 0.12, 0.22]} />
        <meshStandardMaterial color="#11141a" roughness={0.8} />
      </mesh>
      <Label3D position={[-0.5, 0.35, 2.35]} small>
        PCIe 슬롯
      </Label3D>

      {/* ATX 24핀 전원 커넥터 */}
      <mesh position={[3.2, 0.18, 1.6]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.3, 0.36, 1.3]} />
        <meshStandardMaterial color="#1c2027" roughness={0.75} />
      </mesh>
      <Label3D position={[3.2, 0.6, 1.6]} small>
        전원 커넥터
      </Label3D>

      {/* 후면 I/O 포트 블록 */}
      <mesh position={[-3.2, 0.3, -1.5]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.5, 0.6, 1.8]} />
        <meshStandardMaterial color="#5d6670" metalness={0.7} roughness={0.4} />
      </mesh>
      <Label3D position={[-3.2, 0.85, -1.5]} small>
        I/O 포트
      </Label3D>

      {/* 커패시터들 (CPU 전원부 주변) */}
      {([
        [-1.95, -1.75], [-1.7, -1.95], [-2.2, -1.95], [0.35, -1.95], [0.6, -1.8], [2.0, 1.75], [2.3, 1.9],
      ] as const).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.2, 0]} userData={{ noHighlight: true }}>
            <cylinderGeometry args={[0.085, 0.085, 0.4, 14]} />
            <meshStandardMaterial color="#3b4250" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.405, 0]} userData={{ noHighlight: true }}>
            <cylinderGeometry args={[0.085, 0.085, 0.01, 14]} />
            <meshStandardMaterial color="#aab4c0" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 코인 배터리 */}
      <mesh position={[-0.6, 0.04, 2.0]} userData={{ noHighlight: true }}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
        <meshStandardMaterial color="#c8cdd4" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/cpu_package.glb');
useGLTF.preload('/models/dimm.glb');
