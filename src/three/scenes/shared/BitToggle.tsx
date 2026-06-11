import { useState } from 'react';
import { Html } from '@react-three/drei';

interface Props {
  position: [number, number, number];
  value: boolean;
  label: string;
  onToggle: () => void;
}

/** 클릭으로 0/1을 바꾸는 입력 스위치 (게이트/CMOS 데모용) */
export function BitToggle({ position, value, label, onToggle }: Props) {
  const [hover, setHover] = useState(false);
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
        userData={{ noHighlight: true }}
      >
        <sphereGeometry args={[hover ? 0.21 : 0.18, 18, 18]} />
        <meshStandardMaterial
          color={value ? '#4cc8ff' : '#39424f'}
          emissive={value ? '#4cc8ff' : hover ? '#4cc8ff' : '#000000'}
          emissiveIntensity={value ? 1.8 : hover ? 0.35 : 0}
          toneMapped={!value}
        />
      </mesh>
      <Html position={[0, 0.45, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="label3d small" style={{ pointerEvents: 'none' }}>
          {label} = {value ? 1 : 0}
        </div>
      </Html>
    </group>
  );
}

/** 출력 표시 램프 */
export function OutputLamp({
  position,
  value,
  label,
  color = '#7ee787',
}: {
  position: [number, number, number];
  value: boolean;
  label: string;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.2, 18, 18]} />
        <meshStandardMaterial
          color={value ? color : '#2a3142'}
          emissive={value ? color : '#000000'}
          emissiveIntensity={value ? 2.2 : 0}
          toneMapped={!value}
        />
      </mesh>
      <Html position={[0, 0.45, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="label3d small" style={{ pointerEvents: 'none' }}>
          {label} = {value ? 1 : 0}
        </div>
      </Html>
    </group>
  );
}
