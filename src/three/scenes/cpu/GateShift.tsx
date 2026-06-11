import { useState } from 'react';
import { Html } from '@react-three/drei';
import { Selectable } from '../../Selectable';
import { Label3D } from '../shared/Label3D';
import { Wire } from '../shared/Wire';
import { BitToggle, OutputLamp } from '../shared/BitToggle';

/**
 * 배럴 시프터: MUX 2단(1칸, 2칸)으로 0~3칸 왼쪽 시프트.
 * 시프트량 버튼에 따라 비트 경로가 바뀌는 것을 시각화.
 */
export function GateShift() {
  const [bits, setBits] = useState([false, true, true, false]); // b3..b0
  const [shift, setShift] = useState(1);

  const toValue = (bs: boolean[]) => bs.reduce((acc, b) => (acc << 1) | (b ? 1 : 0), 0);
  const value = toValue(bits);
  const out = (value << shift) & 0xf;
  const outBits = [3, 2, 1, 0].map((i) => ((out >> i) & 1) === 1);

  // 1단: shift&1 → 1칸, 2단: shift&2 → 2칸
  const s1 = (shift & 1) !== 0;
  const s2 = (shift & 2) !== 0;
  const mid = (value << (s1 ? 1 : 0)) & 0xf;
  const midBits = [3, 2, 1, 0].map((i) => ((mid >> i) & 1) === 1);

  const X = (i: number) => 2.4 - i * 1.6; // 비트 인덱스 → x좌표 (b3 왼쪽)

  return (
    <group>
      {/* 입력 비트 토글 */}
      {bits.map((b, idx) => {
        const bitIndex = 3 - idx;
        return (
          <BitToggle
            key={idx}
            position={[X(bitIndex), 2.4, 0]}
            value={b}
            label={`b${bitIndex}`}
            onToggle={() => setBits(bits.map((v, j) => (j === idx ? !v : v)))}
          />
        );
      })}

      {/* ===== 1단 MUX (1칸 시프트 여부) ===== */}
      <Selectable nodeId="cmos">
        {[3, 2, 1, 0].map((i) => (
          <mesh key={i} position={[X(i), 1.0, 0]}>
            <boxGeometry args={[1.0, 0.6, 0.3]} />
            <meshStandardMaterial
              color={s1 ? '#3a5a40' : '#33405a'}
              emissive={s1 ? '#7ee787' : '#000000'}
              emissiveIntensity={s1 ? 0.25 : 0}
              roughness={0.4}
            />
          </mesh>
        ))}
      </Selectable>
      <Label3D position={[4.2, 1.0, 0]} small>
        {`MUX 1단: ${s1 ? '1칸 시프트' : '통과'}`}
      </Label3D>

      {/* 입력→1단 배선: s1이면 대각선(한 칸 왼쪽으로) */}
      {[3, 2, 1, 0].map((i) => {
        const destBit = s1 ? i + 1 : i;
        if (destBit > 3) return null;
        return (
          <Wire
            key={i}
            points={[[X(i), 2.15, 0], [X(destBit), 1.35, 0]]}
            radius={0.03}
            lit={bits[3 - i]}
          />
        );
      })}

      {/* ===== 2단 MUX (2칸 시프트 여부) ===== */}
      <Selectable nodeId="cmos">
        {[3, 2, 1, 0].map((i) => (
          <mesh key={i} position={[X(i), -0.5, 0]}>
            <boxGeometry args={[1.0, 0.6, 0.3]} />
            <meshStandardMaterial
              color={s2 ? '#3a5a40' : '#33405a'}
              emissive={s2 ? '#7ee787' : '#000000'}
              emissiveIntensity={s2 ? 0.25 : 0}
              roughness={0.4}
            />
          </mesh>
        ))}
      </Selectable>
      <Label3D position={[4.2, -0.5, 0]} small>
        {`MUX 2단: ${s2 ? '2칸 시프트' : '통과'}`}
      </Label3D>

      {/* 1단→2단 배선 */}
      {[3, 2, 1, 0].map((i) => {
        const destBit = s2 ? i + 2 : i;
        if (destBit > 3) return null;
        return (
          <Wire
            key={i}
            points={[[X(i), 0.65, 0], [X(destBit), -0.15, 0]]}
            radius={0.03}
            lit={midBits[3 - i]}
          />
        );
      })}

      {/* 출력 램프 */}
      {[3, 2, 1, 0].map((i) => (
        <group key={i}>
          <Wire points={[[X(i), -0.85, 0], [X(i), -1.55, 0]]} radius={0.03} lit={outBits[3 - i]} litColor="#7ee787" />
          <OutputLamp position={[X(i), -1.9, 0]} value={outBits[3 - i]} label={`y${i}`} />
        </group>
      ))}

      {/* 시프트량 버튼 */}
      <Html position={[0, -3.0, 0]} center zIndexRange={[5, 0]}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="label3d small">시프트량:</span>
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setShift(n)}
              style={{
                width: 38,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${shift === n ? '#4cc8ff' : 'rgba(255,255,255,.12)'}`,
                background: shift === n ? 'rgba(76,200,255,.18)' : 'rgba(14,19,31,.8)',
                color: shift === n ? '#4cc8ff' : '#9aa7ba',
                fontFamily: 'inherit',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
          <span className="label3d small">{`${value} ≪ ${shift} = ${out} (×${2 ** shift})`}</span>
        </div>
      </Html>
    </group>
  );
}
