import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { COLORS } from '../../materials';

const CHIP_XS = [-2.8, -2.05, -1.3, -0.55, 0.55, 1.3, 2.05, 2.8];

/** DIMM 모듈 정면 뷰: 메모리 칩 8개 + 레지스터(버퍼) 칩 + 골드 핑거 */
export function DramModule() {
  return (
    <group>
      {/* 정면 보조광 — 세워진 모듈이 어둡지 않게 */}
      <pointLight position={[0, 2.2, 4.5]} intensity={14} color="#cfe3f5" />
      {/* 모듈 PCB (세워진 상태) */}
      <mesh position={[0, 1.45, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[6.4, 2.5, 0.12]} />
        <meshStandardMaterial color="#0d2b3b" roughness={0.55} metalness={0.1} />
      </mesh>

      {/* 골드 핑거 (커넥터 접점) — 노치 기준 좌우 분리 */}
      {Array.from({ length: 24 }, (_, i) => {
        const x = -2.99 + i * 0.26;
        if (Math.abs(x) < 0.22) return null; // 노치 자리
        return (
          <mesh key={i} position={[x, 0.34, 0.07]} userData={{ noHighlight: true }}>
            <boxGeometry args={[0.14, 0.32, 0.02]} />
            <meshStandardMaterial color={COLORS.gold} metalness={0.9} roughness={0.25} />
          </mesh>
        );
      })}
      {/* 노치 */}
      <mesh position={[0, 0.28, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.22, 0.34, 0.16]} />
        <meshStandardMaterial color="#0a0e14" />
      </mesh>

      {/* 메모리 칩 8개 — 클릭하면 셀 어레이로 */}
      <Selectable nodeId="dram-array">
        {CHIP_XS.map((x, i) => (
          <group key={i} position={[x, 1.75, 0]}>
            <mesh position={[0, 0, 0.11]}>
              <boxGeometry args={[0.62, 1.1, 0.1]} />
              <meshStandardMaterial color={COLORS.chip} roughness={0.38} metalness={0.35} />
            </mesh>
            {/* 칩 양옆 솔더 볼 패드 줄 */}
            {[-0.36, 0.36].map((dx, j) => (
              <mesh key={j} position={[dx, 0, 0.08]}>
                <boxGeometry args={[0.05, 0.95, 0.03]} />
                <meshStandardMaterial color="#7d838c" metalness={0.8} roughness={0.35} />
              </mesh>
            ))}
            {/* 칩 표면 마킹 */}
            <mesh position={[0, 0.3, 0.165]}>
              <boxGeometry args={[0.4, 0.08, 0.005]} />
              <meshStandardMaterial color="#3a4148" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </Selectable>
      <Label3D position={[-1.65, 3.0, 0]} accent>
        메모리 칩 — 클릭해서 셀 어레이 보기
      </Label3D>

      {/* 중앙 레지스터/버퍼 칩 (명령/주소 분배) */}
      <mesh position={[0, 1.55, 0.11]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.52, 0.52, 0.1]} />
        <meshStandardMaterial color={COLORS.chipLight} roughness={0.4} metalness={0.3} />
      </mesh>
      <Label3D position={[0, 0.9, 0.3]} small>
        레지스터 칩 (명령/주소 버퍼)
      </Label3D>

      {/* SPD EEPROM */}
      <mesh position={[2.92, 0.85, 0.1]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.26, 0.18, 0.08]} />
        <meshStandardMaterial color={COLORS.chipLight} roughness={0.4} />
      </mesh>
      <Label3D position={[2.92, 1.2, 0.2]} small>
        SPD
      </Label3D>
    </group>
  );
}
