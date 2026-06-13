import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Label3D } from '../shared/Label3D';

const N_COLOR = '#5aa2ff'; // n형 (전자가 다수)
const P_COLOR = '#ff7a59'; // p형 (정공이 다수)

interface DeviceProps {
  position: [number, number, number];
  type: 'NMOS' | 'PMOS';
}

/**
 * MOSFET 단면 모형: 기판 + 소스/드레인 도핑 영역 + 산화막 + 게이트.
 * 게이트 클릭 → 전압 인가 → 반전층(채널) 형성 + 캐리어 흐름 애니메이션.
 */
function MosfetDevice({ position, type }: DeviceProps) {
  const [gateOn, setGateOn] = useState(type === 'NMOS');
  const [hover, setHover] = useState(false);
  const channel = useRef<THREE.Mesh>(null);
  const channelMat = useRef<THREE.MeshStandardMaterial>(null);
  const carriers = useRef<THREE.InstancedMesh>(null);
  const progress = useRef(0);

  const isN = type === 'NMOS';
  const bodyColor = isN ? '#4a3340' : '#2c3a52'; // p형 기판 / n웰
  const dopeColor = isN ? N_COLOR : P_COLOR; // n+ / p+
  const carrierColor = isN ? '#7ec8ff' : '#ffb09a';

  const N_CARRIERS = 14;
  const dummy = new THREE.Object3D();

  useFrame((state, delta) => {
    // 채널 형성/소멸
    progress.current = THREE.MathUtils.clamp(progress.current + (gateOn ? delta * 2.2 : -delta * 2.2), 0, 1);
    const p = progress.current;
    if (channel.current && channelMat.current) {
      channel.current.scale.x = Math.max(0.01, p);
      channel.current.visible = p > 0.02;
      channelMat.current.emissiveIntensity = p * 1.6;
      channelMat.current.opacity = p * 0.9;
    }
    // 캐리어 흐름 (소스 → 드레인)
    if (carriers.current) {
      carriers.current.visible = p > 0.85;
      if (p > 0.85) {
        for (let i = 0; i < N_CARRIERS; i++) {
          const t = ((state.clock.elapsedTime * 0.55 + i / N_CARRIERS) % 1) * 2.4 - 1.2;
          dummy.position.set(t, 0.62, ((i * 37) % 5) * 0.1 - 0.25);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          carriers.current.setMatrixAt(i, dummy.matrix);
        }
        carriers.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group position={position}>
      {/* 기판 (유리처럼 반투명) */}
      <RoundedBox args={[3.6, 1.3, 1.6]} radius={0.06} smoothness={4} position={[0, 0, 0]} userData={{ noHighlight: true }}>
        <meshPhysicalMaterial color={bodyColor} roughness={0.35} metalness={0.1} transparent opacity={0.9} clearcoat={0.6} clearcoatRoughness={0.2} />
      </RoundedBox>
      <Label3D position={[0, -0.95, 0.5]} small>
        {isN ? 'p형 기판 (정공 다수)' : 'n형 웰 (전자 다수)'}
      </Label3D>

      {/* 소스 / 드레인 (고농도 도핑) */}
      {[-1.25, 1.25].map((x) => (
        <RoundedBox key={x} args={[1.0, 0.52, 1.4]} radius={0.05} smoothness={4} position={[x, 0.42, 0]} userData={{ noHighlight: true }}>
          <meshStandardMaterial color={dopeColor} roughness={0.38} metalness={0.2} emissive={dopeColor} emissiveIntensity={0.22} />
        </RoundedBox>
      ))}
      <Label3D position={[-1.25, 1.45, 0]} small>
        {`소스 (${isN ? 'n+' : 'p+'})`}
      </Label3D>
      <Label3D position={[1.25, 1.45, 0]} small>
        {`드레인 (${isN ? 'n+' : 'p+'})`}
      </Label3D>

      {/* 산화막 (절연, 유리) */}
      <mesh position={[0, 0.71, 0]} userData={{ noHighlight: true }}>
        <boxGeometry args={[1.4, 0.08, 1.45]} />
        <meshPhysicalMaterial color="#eaf2ff" roughness={0.08} transparent opacity={0.45} clearcoat={1} clearcoatRoughness={0.03} ior={1.46} />
      </mesh>

      {/* 게이트 전극 — 클릭으로 전압 토글 */}
      <RoundedBox
        args={[1.4, 0.36, 1.45]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.95, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setGateOn(!gateOn);
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
      >
        <meshStandardMaterial
          color="#d4a843"
          metalness={0.92}
          roughness={0.25}
          emissive={gateOn ? '#ffd97a' : hover ? '#ffd97a' : '#000000'}
          emissiveIntensity={gateOn ? 0.9 : hover ? 0.3 : 0}
        />
      </RoundedBox>
      <Label3D position={[0, 1.75, 0]} accent>
        {`게이트 ${isN ? (gateOn ? '+V ON' : '0V OFF') : gateOn ? '0V ON' : '+V OFF'} — 클릭`}
      </Label3D>

      {/* 반전층 (채널) — 게이트 전압으로 형성 */}
      <mesh ref={channel} position={[0, 0.62, 0]} visible={false} userData={{ noHighlight: true }}>
        <boxGeometry args={[1.5, 0.1, 1.35]} />
        <meshStandardMaterial
          ref={channelMat}
          color={dopeColor}
          emissive={dopeColor}
          emissiveIntensity={0}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>

      {/* 캐리어 (전자/정공) 흐름 */}
      <instancedMesh ref={carriers} args={[undefined, undefined, N_CARRIERS]} visible={false} userData={{ noHighlight: true }}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={carrierColor} emissive={carrierColor} emissiveIntensity={2.4} toneMapped={false} />
      </instancedMesh>

      <Label3D position={[0, 0.25, 0.95]} small>
        {gateOn ? `반전층(채널) 형성 — ${isN ? '전자' : '정공'} 이동` : '채널 없음 — 전류 차단'}
      </Label3D>

      {/* 디바이스 이름 + 구조 비유 */}
      <Label3D position={[0, -1.5, 0.4]} accent>
        {isN ? 'NMOS (n-p-n ↔ npn 비유)' : 'PMOS (p-n-p ↔ pnp 비유)'}
      </Label3D>
    </group>
  );
}

export function MosfetPhysics() {
  return (
    <group>
      <MosfetDevice position={[-2.6, 0.4, 0]} type="NMOS" />
      <MosfetDevice position={[2.6, 0.4, 0]} type="PMOS" />
      <Label3D position={[0, 3.0, 0]} small>
        게이트를 클릭해 전압을 걸어 보세요 — 전기장이 채널을 만듭니다
      </Label3D>
    </group>
  );
}
