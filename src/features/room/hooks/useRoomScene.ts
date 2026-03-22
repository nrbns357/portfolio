import { useRef, useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const useRoomScene = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.OrthographicCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    console.log('[useRoomScene] useEffect fired, container:', container);
    if (!container) {
      console.log('[useRoomScene] container is null, returning');
      return;
    }

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Fallback for initial render where absolute div might hold 0 size momentarily
    if (width === 0 || height === 0) {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    console.log('[useRoomScene] mapped container size:', width, height);

    // Scene
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color('#080810');

    // Orthographic Camera (Isometric)
    const aspect = width / height;
    const d = 12;
    const newCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
    newCamera.position.set(25, 25, 25);
    newCamera.lookAt(0, 2, 0);

    // Renderer
    const newRenderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    newRenderer.setSize(width, height);
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    newRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    newRenderer.toneMappingExposure = 2.2;

    container.appendChild(newRenderer.domElement);

    // Controls
    const controls = new OrbitControls(newCamera, newRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = 0.1;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minZoom = 0.5;
    controls.maxZoom = 3;

    // ============ LIGHTING ============

    // Warm ambient — enough to see shapes
    const ambientLight = new THREE.AmbientLight(0xfff0e0, 0.9);
    newScene.add(ambientLight);

    // Moonlight from window (cool blue directional)
    const moonLight = new THREE.DirectionalLight(0x8899cc, 3.0);
    moonLight.position.set(-20, 20, 15);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 60;
    moonLight.shadow.camera.left = -20;
    moonLight.shadow.camera.right = 20;
    moonLight.shadow.camera.top = 20;
    moonLight.shadow.camera.bottom = -20;
    moonLight.shadow.bias = -0.0002;
    newScene.add(moonLight);

    // Neon Pink/Purple — under desk
    const neonPink1 = new THREE.PointLight(0xff44aa, 40, 25);
    neonPink1.position.set(0, 0.3, 2);
    newScene.add(neonPink1);

    const neonPurple1 = new THREE.PointLight(0x8855ff, 35, 22);
    neonPurple1.position.set(-6, 6, -4);
    newScene.add(neonPurple1);

    // Warm desk lamp glow
    const deskLamp = new THREE.PointLight(0xffecd2, 60, 25);
    deskLamp.position.set(4, 6.5, -1);
    deskLamp.castShadow = true;
    newScene.add(deskLamp);

    // Monitor backlight
    const monitorGlow = new THREE.PointLight(0x6688ff, 25, 20);
    monitorGlow.position.set(0, 5.5, -3.5);
    newScene.add(monitorGlow);

    // Extra overhead fill light
    const fillLight = new THREE.PointLight(0xffeedd, 25, 40);
    fillLight.position.set(0, 14, 0);
    newScene.add(fillLight);

    // Set state to trigger child component rendering
    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    // Animation
    let animationFrameId = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      newRenderer.render(newScene, newCamera);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      // Mouse tracking can be used later
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const a = w / h;
      newCamera.left = -d * a;
      newCamera.right = d * a;
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
