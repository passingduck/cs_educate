import { Html } from '@react-three/drei';

interface Props {
  position: [number, number, number];
  children: string;
  accent?: boolean;
  small?: boolean;
}

/** 씬 내 한국어 라벨 — DOM 기반이라 한글이 선명함 */
export function Label3D({ position, children, accent, small }: Props) {
  return (
    <Html position={position} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`label3d${accent ? ' accent' : ''}${small ? ' small' : ''}`}>{children}</div>
    </Html>
  );
}
