import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";

function AvatarModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function AvatarViewer({ modelUrl }) {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#fff" }}>
      <Canvas camera={{ position: [0, 1.5, 3] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <AvatarModel url={modelUrl} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}

export default AvatarViewer;
