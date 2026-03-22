import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const useVinylScene = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.OrthographicCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Fallback for initial render
    if (width === 0 || height === 0) {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color("#1a1a1a");

    const aspect = width / height;
    const d = 9;
    const newCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
    newCamera.position.set(20, 20, 20);
    newCamera.lookAt(0, 0, 0);

    const newRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    newRenderer.setSize(width, height);
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    newRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    newRenderer.toneMappingExposure = 1.2;

    container.appendChild(newRenderer.domElement);

    const controls = new OrbitControls(newCamera, newRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;

    // Lighting - Cozy Warm Tone
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.15); // Much dimmer ambient
    newScene.add(ambientLight);
    
    // Warm spotlight from above/back
    const spotLight = new THREE.SpotLight(0xffecd2, 800);
    spotLight.position.set(10, 30, 5);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 100;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.bias = -0.0001;
    newScene.add(spotLight);

    // Soft fill light
    const fillLight = new THREE.DirectionalLight(0xaabbff, 0.8);
    fillLight.position.set(-15, 10, -15);
    newScene.add(fillLight);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    let animationFrameId = 0;
    let mouse = { x: 0, y: 0 };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Parallax effect
      const targetX = (mouse.x * 2.0);
      const targetY = (mouse.y * 2.0);
      
      newCamera.position.x += (20 + targetX - newCamera.position.x) * 0.05;
      newCamera.position.y += (20 - targetY - newCamera.position.y) * 0.05;
      newCamera.position.z += (20 + targetX - newCamera.position.z) * 0.05;
      
      controls.update();
      newRenderer.render(newScene, newCamera);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      let w = container.clientWidth;
      let h = container.clientHeight;
      if (w === 0 || h === 0) { w = window.innerWidth; h = window.innerHeight; }
      
      const aspect = w / h;
      newCamera.left = -d * aspect;
      newCamera.right = d * aspect;
      newCamera.updateProjectionMatrix();
      newRenderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeChild(newRenderer.domElement);
      newRenderer.dispose();
      controls.dispose();
      setScene(null);
      setCamera(null);
      setRenderer(null);
    };
  }, []);

  return { scene, camera, renderer };
};
