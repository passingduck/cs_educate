import { Selectable } from '../Selectable';
import { Label3D } from './shared/Label3D';
import { Wire } from './shared/Wire';
import { COLORS } from '../materials';

/** 케이스 내부: 메인보드 + CPU/DRAM/SSD */
export function Level1Motherboard() {
  return (
    <group>
      {/* PCB 기판 */}
      <mesh position={[0, -0.08, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[7, 0.16, 5.2]} />
        <meshStandardMaterial color={COLORS.pcb} roughness={0.55} metalness={0.15} />
      </mesh>

      {/* 구리 배선 트레이스 */}
      <Wire points={[[-0.8, 0.02, -0.8], [1.2, 0.02, -0.8], [2.5, 0.02, -0.6]]} radius={0.022} color={COLORS.copper} />
      <Wire points={[[-0.8, 0.02, -0.4], [0.8, 0.02, 0.2], [2.5, 0.02, 0.2]]} radius={0.022} color={COLORS.copper} />
      <Wire points={[[-1.2, 0.02, -0.4], [-1.8, 0.02, 0.6], [-2.2, 0.02, 1.4]]} radius={0.022} color={COLORS.copper} />
      <Wire points={[[-0.8, 0.02, -1.3], [-0.8, 0.02, -2.1]]} radius={0.022} color={COLORS.copper} />

      {/* ===== CPU 패키지 ===== */}
      <Selectable nodeId="cpu" position={[-0.8, 0, -0.8]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.5, 0.1, 1.5]} />
          <meshStandardMaterial color="#1d4d3c" roughness={0.5} />
        </mesh>
        {/* IHS (히트스프레더) */}
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[1.15, 0.16, 1.15]} />
          <meshStandardMaterial color={COLORS.silver} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.92, 0.02, 0.92]} />
          <meshStandardMaterial color="#c4ccd6" metalness={0.92} roughness={0.22} />
        </mesh>
      </Selectable>
      <Label3D position={[-0.8, 0.85, -0.8]} accent>
        CPU
      </Label3D>

      {/* ===== DRAM DIMM x2 ===== */}
      <Selectable nodeId="dram" position={[2.3, 0, -0.2]}>
        {[0, 0.45].map((dx, i) => (
          <group key={i} position={[dx, 0, 0]}>
            <mesh position={[0, 0.62, 0]}>
              <boxGeometry args={[0.1, 1.24, 2.6]} />
              <meshStandardMaterial color="#0d2b3b" roughness={0.55} />
            </mesh>
            {/* 칩들 */}
            {Array.from({ length: 4 }, (_, j) => (
              <mesh key={j} position={[0.065, 0.62, -0.9 + j * 0.6]}>
                <boxGeometry args={[0.04, 0.5, 0.42]} />
                <meshStandardMaterial color={COLORS.chip} roughness={0.4} metalness={0.3} />
              </mesh>
            ))}
            {/* 슬롯 */}
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.2, 0.12, 2.8]} />
              <meshStandardMaterial color="#11141a" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </Selectable>
      <Label3D position={[2.5, 1.7, -0.2]} accent>
        DRAM
      </Label3D>

      {/* ===== SSD (M.2) ===== */}
      <Selectable nodeId="ssd" position={[-2.2, 0, 1.6]}>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[1.9, 0.06, 0.6]} />
          <meshStandardMaterial color="#0f2438" roughness={0.5} />
        </mesh>
        {[-0.55, 0.05, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.11, 0]}>
            <boxGeometry args={[0.42, 0.05, 0.42]} />
            <meshStandardMaterial color={COLORS.chip} roughness={0.4} metalness={0.3} />
          </mesh>
        ))}
      </Selectable>
      <Label3D position={[-2.2, 0.6, 1.6]} accent>
        SSD
      </Label3D>

      {/* 칩셋 */}
      <mesh position={[0.9, 0.1, 1.4]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.7, 0.12, 0.7]} />
        <meshStandardMaterial color={COLORS.chip} roughness={0.4} metalness={0.3} />
      </mesh>
      <Label3D position={[0.9, 0.45, 1.4]} small>
        칩셋
      </Label3D>

      {/* 커패시터들 */}
      {([
        [-1.9, -1.6], [-1.7, -1.9], [-2.1, -1.9], [0.3, -2.0], [0.6, -2.0], [2.0, 1.8], [2.3, 1.8],
      ] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} userData={{ noHighlight: true }}>
          <cylinderGeometry args={[0.09, 0.09, 0.42, 14]} />
          <meshStandardMaterial color="#3b4250" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* 코인 배터리 */}
      <mesh position={[-0.6, 0.05, 2.1]} userData={{ noHighlight: true }}>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 24]} />
        <meshStandardMaterial color="#c8cdd4" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
}
