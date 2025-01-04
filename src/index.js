import { createRoot } from 'react-dom/client';
import { Canvas} from '@react-three/fiber';
import { 
  OrbitControls, 
  Stars,
  Environment,
  ContactShadows,
  softShadows,
} from "@react-three/drei";
import { Physics, usePlane, useBox, useSphere } from "@react-three/cannon";
import { useRef, Suspense, useState, useEffect } from 'react';
import "./styles.css";

softShadows();

const HDRI_PATH = '/dikhololo_night_4k.hdr';

function Instructions() {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      padding: '16px',
      borderRadius: '8px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000
    }}>
      <h2 style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px',
        fontSize: '16px'
      }}>Controls:</h2>
      <ul style={{ 
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        <li>🖱️ Left Click: Make objects jump</li>
        <li>🖱️ Right Click + Drag: Rotate camera</li>
        <li>🖱️ Middle Click + Drag: Pan</li>
        <li>⚡ Spacebar: Toggle slow motion</li>
      </ul>
    </div>
  );
}

function FloatingBox({ position = [0, 2, 0], color = "#ff69b4", scale = 1 }) {
  const [ref, api] = useBox(() => ({ 
    mass: 1, 
    position,
    args: [scale, scale, scale],
    material: { restitution: 0.8 }
  }));

  return (
    <mesh
      onClick={() => {
        api.velocity.set(0, 8, 0);
        api.angularVelocity.set(
          Math.random() * 3,
          Math.random() * 3,
          Math.random() * 3
        );
      }}
      ref={ref}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[scale, scale, scale]} />
      <meshStandardMaterial
        metalness={0.9}
        roughness={0.5}
        color={color}
      />
    </mesh>
  );
}

function BouncingSphere({ position = [2, 5, 2], color = "#4fc3f7", scale = 1 }) {
  const [ref, api] = useSphere(() => ({ 
    mass: 1, 
    position,
    args: [0.5 * scale],
    material: { restitution: 0.9 }
  }));

  return (
    <mesh 
      ref={ref} 
      castShadow
      onClick={() => {
        api.velocity.set(0, 8, 0);
        api.angularVelocity.set(
          Math.random() * 3,
          Math.random() * 3,
          Math.random() * 3
        );
      }}
    >
      <sphereGeometry args={[0.5 * scale, 32, 32]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
function Walls() {
  usePlane(() => ({ position: [0, 0, -15], rotation: [0, 0, 0] }))
  usePlane(() => ({ position: [0, 0, 15], rotation: [0, Math.PI, 0] })); 
  usePlane(() => ({ position: [-15, 0, 0], rotation: [0, Math.PI / 2, 0] }))
  usePlane(() => ({ position: [15, 0, 0], rotation: [0, -Math.PI / 2, 0] }))
  return null;
}

function GlossyPlane() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static'
  }));

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        color="#303030"
        metalness={0.8}
        roughness={0.5}
      />
    </mesh>
  );
}

function Scene() {
  const [slowMotion, setSlowMotion] = useState(false);
  const physicsRef = useRef();

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        setSlowMotion(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <Canvas 
        shadows 
        camera={{ position: [-5, 5, 5], fov: 90 }}
        gl={{
          antialias: true,
          alpha: false,
          stencil: false,
          depth: true,
        }}
      >
        <color attach="background" args={['#202020']} />
        
        <OrbitControls 
          makeDefault 
          minDistance={2}
          maxDistance={50}
        />
        
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0.5} 
          fade
          speed={0.5}
        />
        
        <ambientLight intensity={0.5} />
        <spotLight 
          position={[10, 15, 10]} 
          angle={0.3} 
          penumbra={1} 
          castShadow 
          intensity={2}
          shadow-mapSize={[1024, 1024]}
        />

        <Suspense fallback={null}>
          <Environment files={HDRI_PATH} background={true} blur={0.5} />

          <Physics 
            ref={physicsRef}
            gravity={[0, slowMotion ? -2 : -9.81, 0]}
            defaultContactMaterial={{
              friction: 0.1,
              restitution: 0.7
            }}
          >
            <Walls />
            <FloatingBox position={[0, 8, 0]} color="#ff69b4" scale={1.2} />
            <FloatingBox position={[-2, 6, -2]} color="#64dd17" scale={0.8} />
            <FloatingBox position={[2, 8, 2]} color="#ff3d00" />
            <BouncingSphere position={[1, 10, 1]} color="#4fc3f7" scale={1.5} />
            <BouncingSphere position={[-1, 12, -1]} color="#ffeb3b" />
            <BouncingSphere position={[2, 15, -2]} color="#ba68c8" scale={0.7} />
            <GlossyPlane />
          </Physics>

          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.6}
            scale={20}
            blur={2}
            far={4}
            resolution={256}
          />
        </Suspense>

      </Canvas>
      <Instructions />
    </>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #202020;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

createRoot(document.getElementById('root')).render(<Scene />);