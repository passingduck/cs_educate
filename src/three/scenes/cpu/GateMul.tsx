import { Selectable } from '../../Selectable';
import { GateSymbol } from './GateSymbol';
import { Label3D } from '../shared/Label3D';
import { Wire } from '../shared/Wire';

/**
 * 4×4 배열 곱셈기 추상화: AND 게이트 격자(부분곱) + 전가산기(FA) 행.
 * AND → CMOS로, FA 블록 → 전가산기 내부로 줌인.
 */
export function GateMul() {
  return (
    <group>
      <Label3D position={[-3.6, 3.1, 0]} small>
        피승수 A (4비트)
      </Label3D>
      <Label3D position={[-4.6, 1.4, 0]} small>
        승수 B
      </Label3D>

      {/* 입력 버스 표시 */}
      {Array.from({ length: 4 }, (_, i) => (
        <Wire key={`a${i}`} points={[[-3.3 + i * 1.5, 2.8, 0], [-3.3 + i * 1.5, 2.0, 0]]} radius={0.03} lit />
      ))}
      {Array.from({ length: 2 }, (_, i) => (
        <Wire key={`b${i}`} points={[[-4.4, 1.7 - i * 1.0, 0], [-3.9, 1.7 - i * 1.0, 0]]} radius={0.03} lit litColor="#ffb454" />
      ))}

      {/* ===== 부분곱: AND 게이트 격자 (2행 × 4열로 단순화) ===== */}
      <Selectable nodeId="cmos">
        {Array.from({ length: 8 }, (_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          return (
            <group key={i} position={[-3.3 + col * 1.5, 1.7 - row * 1.0, 0]}>
              <GateSymbol type="AND" scale={0.42} lit={(i * 7) % 3 === 0} />
            </group>
          );
        })}
      </Selectable>
      <Label3D position={[0, 2.4, 0]} accent>
        AND 격자 — 부분곱 (Partial Products)
      </Label3D>

      {/* 부분곱 → 가산기 배선 */}
      {Array.from({ length: 4 }, (_, i) => (
        <Wire
          key={i}
          points={[[-3.3 + i * 1.5, 0.4, 0], [-3.0 + i * 1.5, -0.5, 0]]}
          radius={0.025}
          color="#39424f"
        />
      ))}

      {/* ===== 전가산기(FA) 행 — 클릭하면 전가산기 내부로 ===== */}
      {Array.from({ length: 2 }, (_, row) => (
        <group key={row}>
          <Selectable nodeId="alu-add">
            {Array.from({ length: 4 }, (_, col) => (
              <group key={col} position={[-3.0 + col * 1.5, -1.0 - row * 1.3, 0]}>
                <mesh>
                  <boxGeometry args={[1.1, 0.85, 0.3]} />
                  <meshStandardMaterial color="#2c4a6e" roughness={0.4} metalness={0.3} />
                </mesh>
                <Label3D position={[0, 0, 0.3]} small>
                  FA
                </Label3D>
              </group>
            ))}
          </Selectable>
          {/* 자리올림 전파 */}
          {Array.from({ length: 3 }, (_, col) => (
            <Wire
              key={col}
              points={[
                [-3.55 + (col + 1) * 1.5, -1.0 - row * 1.3, 0],
                [-2.45 + col * 1.5, -1.0 - row * 1.3, 0],
              ]}
              radius={0.025}
              lit
              litColor="#ffb454"
            />
          ))}
        </group>
      ))}
      <Label3D position={[3.0, -1.6, 0]} small>
        자리올림 전파 →
      </Label3D>

      {/* 결과 */}
      <Wire points={[[-1.5, -2.9, 0], [-1.5, -3.5, 0]]} radius={0.03} lit litColor="#7ee787" />
      <Label3D position={[-1.5, -3.8, 0]} accent>
        곱셈 결과 P = A × B
      </Label3D>
      <Label3D position={[0, -4.5, 0]} small>
        FA 블록 클릭 → 전가산기 내부 · AND 클릭 → CMOS
      </Label3D>
    </group>
  );
}
