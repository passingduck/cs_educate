import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { COLORS } from '../../materials';

/** DIMM 모듈 정면 뷰: 메모리 칩 8개 + 레지스터(버퍼) 칩 + 골드 핑거 */
export function DramModule() {
  return (
    <group>
      {/* 모듈 PCB (세워진 상태) */}
      <mesh position={[0, 1.3, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[6.4, 2.4, 0.12]} />
        <meshStandardMaterial color="#0d2b3b" roughness={0.55} metalness={0.1} />
      </mesh>

      {/* 골드 핑거 (커넥터 접점) */}
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} position={[-2.9 + i * 0.252, 0.06, 0.07]} userData={{ noHighlight: true }}>
          <boxGeometry args={[0.13, 0.28, 0.02]} />
          <meshStandardMaterial color={COLORS.gold} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}

      {/* 메모리 칩 8개 — 클릭하면 셀 어레이로 */}
      <Selectable nodeId="dram-array">
        {Array.from({ length: 8 }, (_, i) => {
          const x = -2.66 + i * 0.76 + (i >= 4 ? 0.76 : 0);
          return (
            <mesh key={i} position={[x, 1.55, 0.12]}>
              <boxGeometry args={[0.62, 1.1, 0.1]} />
              <meshStandardMaterial color={COLORS.chip} roughness={0.38} metalness={0.35} />
            </mesh>
          );
        })}
      </Selectable>
      <Label3D position={[-1.5, 2.75, 0]} accent>
        메모리 칩 — 클릭해서 셀 어레이 보기
      </Label3D>

      {/* 중앙 레지스터/버퍼 칩 (컨트롤 신호 분배) */}
      <mesh position={[0.38, 1.45, 0.12]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.55, 0.55, 0.1]} />
        <meshStandardMaterial color={COLORS.chipLight} roughness={0.4} metalness={0.3} />
      </mesh>
      <Label3D position={[0.38, 0.85, 0.3]} small>
        레지스터 칩 (명령/주소 버퍼)
      </Label3D>

      {/* SPD EEPROM */}
      <mesh position={[2.92, 0.62, 0.1]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.28, 0.2, 0.08]} />
        <meshStandardMaterial color={COLORS.chipLight} roughness={0.4} />
      </mesh>

      {/* 노치 */}
      <mesh position={[0.38, 0.06, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[0.18, 0.3, 0.16]} />
        <meshStandardMaterial color="#0a0e14" />
      </mesh>
    </group>
  );
}
