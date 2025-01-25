import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Stars,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { Physics, usePlane, useBox, useSphere, useCylinder } from "@react-three/cannon";
import { useRef, Suspense, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
const HDRI_PATH = 'https://cosmicplayground.vercel.app/dikhololo_night_4k.hdr';

function ExplosionParticles({ position, color }) {
  const particleCount = 50;
  const particleSize = 0.2;
  const ref = useRef();

  const [particles] = useState(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      temp.push({
        position: new THREE.Vector3(position.x, position.y, position.z),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          4 + Math.random() * 2,
          Math.sin(angle) * speed
        ),
        decay: 0.95 + Math.random() * 0.03
      });
    }
    return temp;
  });

  useFrame((state, delta) => {
    particles.forEach(particle => {
      particle.velocity.y -= 9.8 * delta;
      particle.position.addScaledVector(particle.velocity, delta);
      particle.velocity.multiplyScalar(particle.decay);
    });

    if (ref.current) {
      const positions = ref.current.geometry.attributes.position.array;
      particles.forEach((particle, i) => {
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;
      });
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={new Float32Array(particleCount * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
function ShapeControls({ addShape }) {
  const [selectedColor, setSelectedColor] = useState("#ff69b4");
  const [selectedSize, setSelectedSize] = useState(1);
  return (
    <div style={{
      position: 'fixed',
      left: '20px',
      top: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      padding: '16px',
      borderRadius: '8px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      width: '200px'
    }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px' }}>
        Add Shapes:
      </h2>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Color:</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          style={{ width: '100%', height: '30px' }}
        />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>
          Size: {selectedSize.toFixed(1)}
        </label>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={selectedSize}
          onChange={(e) => setSelectedSize(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      {['Box', 'Sphere', 'Cylinder', 'Pyramid'].map(shape => (
        <button
          key={shape}
          onClick={() => addShape(shape, selectedColor, selectedSize)}
          style={{
            display: 'block',
            margin: '8px 0',
            padding: '8px 16px',
            backgroundColor: '#444',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            width: '100%'
          }}
          onMouseOver={e => e.target.style.backgroundColor = '#555'}
          onMouseOut={e => e.target.style.backgroundColor = '#444'}
        >
          {shape}
        </button>
      ))}
    </div>
  );
}

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
      <h2 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        Controls:
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
        <li>🖱️ Left Click: Make objects jump</li>
        <li>🖱️ Right Click: Remove object</li>
        <li>🖱️ Right Click + Drag: Rotate camera</li>
        <li>🖱️ Middle Click + Drag: Pan</li>
        <li>⚡ Spacebar: Toggle slow motion</li>
      </ul>
    </div>
  );
}

function FloatingBox({ position = [0, 2, 0], color = "#ff69b4", scale = 1, onContextMenu }) {
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
        api.angularVelocity.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      }}
      ref={ref}
      castShadow
      onContextMenu={(e) => {
        e.stopPropagation();
        const position = new THREE.Vector3();
        e.object.getWorldPosition(position);
        onContextMenu(position);
      }}
      receiveShadow
    >
      <boxGeometry args={[scale, scale, scale]} />
      <meshStandardMaterial 
  color={color} 
  metalness={0.95}
  roughness={0.25}
  envMapIntensity={1.2}
  emissive={color}
  emissiveIntensity={0.1}
/>
    </mesh>
  );
}

function BouncingSphere({ position = [2, 5, 2], color = "#4fc3f7", scale = 1, onContextMenu }) {
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
        api.angularVelocity.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        const position = new THREE.Vector3();
        e.object.getWorldPosition(position);
        onContextMenu(position);
      }}
    >
      <sphereGeometry args={[0.5 * scale, 32, 32]} />
      <meshStandardMaterial 
  color={color} 
  metalness={0.95}
  roughness={0.25}
  envMapIntensity={1.2}
  emissive={color}
  emissiveIntensity={0.1}
/>
    </mesh>
  );
}

function BouncingCylinder({ position = [0, 5, 0], color = "#9c27b0", scale = 1, onContextMenu }) {
  const [ref, api] = useCylinder(() => ({
    mass: 1,
    position,
    args: [0.5 * scale, 0.5 * scale, scale, 16],
    material: { restitution: 0.85 }
  }));

  return (
    <mesh
      ref={ref}
      castShadow
      onClick={() => {
        api.velocity.set(0, 8, 0);
        api.angularVelocity.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        const position = new THREE.Vector3();
        e.object.getWorldPosition(position);
        onContextMenu(position);
      }}
    >
      <cylinderGeometry args={[0.5 * scale, 0.5 * scale, scale, 32]} />
      <meshStandardMaterial 
  color={color} 
  metalness={0.95}
  roughness={0.25}
  envMapIntensity={1.2}
  emissive={color}
  emissiveIntensity={0.1}
/>
    </mesh>
  );
}

function BouncingPyramid({ position = [0, 5, 0], color = "#ffd700", scale = 1, onContextMenu }) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [scale, scale, scale],
    material: { restitution: 0.85 }
  }));

  return (
    <mesh
      ref={ref}
      castShadow
      onClick={() => {
        api.velocity.set(0, 8, 0);
        api.angularVelocity.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        const position = new THREE.Vector3();
        e.object.getWorldPosition(position);
        onContextMenu(position);
      }}
    >
      <coneGeometry args={[0.7 * scale, scale, 4]} />
      <meshStandardMaterial 
  color={color} 
  metalness={0.95}
  roughness={0.25}
  envMapIntensity={1.2}
  emissive={color}
  emissiveIntensity={0.1}
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
        color="#404040"
        metalness={0.9}
        roughness={0.3}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}


function Scene() {
  const [slowMotion, setSlowMotion] = useState(false);
  const [shapes, setShapes] = useState(() => {
    const initialShapes = [];
    const types = ['Box', 'Sphere', 'Cylinder', 'Pyramid'];
    
    types.forEach(type => {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        initialShapes.push({
          type,
          color: ["#ff69b4", "#4fc3f7", "#9c27b0", "#64dd17", "#ff3d00", "#ffeb3b"][Math.floor(Math.random() * 6)],
          scale: 0.5 + Math.random() * 0.5,
          position: [
            (Math.random() - 0.5) * 10,
            5 + Math.random() * 3,
            (Math.random() - 0.5) * 10
          ],
          id: Date.now() + Math.random()
        });
      }
    });
    return initialShapes;
  });
  const [explosions, setExplosions] = useState([]);
  const physicsRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        setSlowMotion(prev => !prev);
      }
    };
    
    const canvas = canvasRef.current;
    const preventContextMenu = (e) => e.preventDefault();
    if (canvas) {
      canvas.addEventListener('contextmenu', preventContextMenu);
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (canvas) {
        canvas.removeEventListener('contextmenu', preventContextMenu);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setExplosions(prev => prev.filter(e => Date.now() - e.id < 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const removeShape = (id, position) => {
    setExplosions(prev => [...prev, { position, id: Date.now(), color: "#ff69b4" }]);
    setTimeout(() => {
      setShapes(prev => prev.filter(shape => shape.id !== id));
    }, 50);
  };

  const addShape = (type, color, scale) => {
    const randomPosition = [
      (Math.random() - 0.5) * 10,
      5 + Math.random() * 3,
      (Math.random() - 0.5) * 10
    ];

    setShapes(prev => [...prev, {
      type,
      color,
      scale,
      position: randomPosition,
      id: Date.now()
    }]);
  };

  return (
    <>
      <ShapeControls addShape={addShape} />
      <Instructions />
      
      <Canvas 
        ref={canvasRef} 
        shadows 
        camera={{ position: [-3, 3, 10], fov: 60 }}
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        <color attach="background" args={['#1a1a1a']} />
        <OrbitControls makeDefault minDistance={5} maxDistance={50} />
        
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-10, 15, -10]} intensity={1} color="#4fc3f7" />
        <spotLight 
          position={[15, 20, 10]} 
          angle={0.25}
          penumbra={0.75}
          intensity={3}
          castShadow
          shadow-mapSize={[2048, 2048]}
          color="#ffffff"
        />

        <Suspense fallback={null}>
          <Environment 
            files={HDRI_PATH} 
            background={true} 
            blur={0.5}
            intensity={1.2}
            ground={{ scale: 50, height: 0, radius: 100 }}
          />
          
          <Physics ref={physicsRef} gravity={[0, slowMotion ? -2 : -9.81, 0]}
            defaultContactMaterial={{ friction: 0.1, restitution: 0.7 }}>
            <Walls />
            <GlossyPlane />
            
            {shapes.map(shape => {
              const props = {
                key: shape.id,
                position: shape.position,
                color: shape.color,
                scale: shape.scale,
                onContextMenu: (position) => removeShape(shape.id, position)
              };

              switch(shape.type) {
                case 'Box':
                  return <FloatingBox {...props} />;
                case 'Sphere':
                  return <BouncingSphere {...props} />;
                case 'Cylinder':
                  return <BouncingCylinder {...props} />;
                case 'Pyramid':
                  return <BouncingPyramid {...props} />;
                default:
                  return null;
              }
            })}
          </Physics>

          {explosions.map((explosion) => (
            <ExplosionParticles 
              key={explosion.id} 
              position={explosion.position}
              color={explosion.color}
            />
          ))}

<ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.8}
            scale={40}
            blur={2.5}
            far={6}
            resolution={512}
            color="#1a1a1a"
          />

<fog attach="fog" args={['#1a1a1a', 15, 40]} />

<Stars 
  radius={150} 
  depth={100} 
  count={3000} 
  factor={6} 
  saturation={0.8} 
  fade 
  speed={0.5}
/>

{explosions.map((explosion) => (
  <ExplosionParticles 
    key={explosion.id} 
    position={explosion.position}
    color={explosion.color}
  />
))}
        </Suspense>
      </Canvas>
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
