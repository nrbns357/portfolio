"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function LPProjectPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;
    let controls: any;

    const initThreeJS = async () => {
      try {
        const width = containerRef.current!.clientWidth || window.innerWidth;
        const height = containerRef.current!.clientHeight || window.innerHeight;
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#f4f1ea');

        // Isometric Camera setup
        const aspect = width / height;
        const d = 9;
        const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
        camera.position.set(20, 20, 20); // 45 degree angle for isometric
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Photorealistic settings
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        containerRef.current!.appendChild(renderer.domElement);

        // Dynamic import OrbitControls to avoid SSR compilation issues
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js').catch(
          () => import('three/examples/jsm/controls/OrbitControls.js')
        );
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        controls.minZoom = 0.5;
        controls.maxZoom = 2.0;

        // --- Ambient & Direct Lighting Setup --- 
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xfff0dd, 5.0); // Warm soft sun
        mainLight.position.set(15, 25, 15);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 60;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        mainLight.shadow.bias = -0.0005;
        mainLight.shadow.radius = 4; // Softer shadows
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xe4eeff, 3.0); // Intense cool fill
        fillLight.position.set(-15, 10, -15);
        scene.add(fillLight);

        // --- Procedural Wood Texture ---
        const createWoodTexture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          
          // Gradient Base
          const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
          gradient.addColorStop(0, '#54301A');
          gradient.addColorStop(0.5, '#452512');
          gradient.addColorStop(1, '#331A0B');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1024, 1024);
          
          // Draw wood grains
          ctx.globalAlpha = 0.06;
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 500; i++) {
            ctx.beginPath();
            let x = Math.random() * 1024;
            let y = 0;
            ctx.moveTo(x, y);
            const curveOffset = (Math.random() - 0.5) * 60;
            const frequency = 40 + Math.random() * 60;
            while (y <= 1024) {
              x += (Math.random() - 0.5) * 4;
              y += 10;
              ctx.lineTo(x + curveOffset * Math.sin(y / frequency), y);
            }
            ctx.strokeStyle = '#0f0502';
            ctx.stroke();
          }
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          return texture;
        };

        const woodTex = createWoodTexture();

        // --- Basic Materials ---
        const woodMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffffff,
          map: woodTex,
          roughness: 0.7, 
          metalness: 0.1 
        });

        const matteBlackMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x141414, 
          roughness: 0.8, 
          metalness: 0.3 
        });

        // Add an environment map subtly for brushed aluminum realism
        const brushedAluminumMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xeeeeee, 
          roughness: 0.3, 
          metalness: 0.85 
        });

        const rubberMaterial = new THREE.MeshStandardMaterial({
          color: 0x1f1f1f,
          roughness: 0.95,
          metalness: 0.05
        });

        // --- Geometry Construction ---
        const turntableGroup = new THREE.Group();
        turntableGroup.position.set(0, -0.5, 0); 
        scene.add(turntableGroup);

        // 1. Wood Base (Detailed Rounded Rectangle)
        const baseWidth = 11;
        const baseDepth = 8;
        const baseHeight = 0.8;
        const radius = 0.4;
        
        const shape = new THREE.Shape();
        const bx = -baseWidth / 2;
        const by = -baseDepth / 2;
        shape.moveTo(bx, by + radius);
        shape.lineTo(bx, by + baseDepth - radius);
        shape.quadraticCurveTo(bx, by + baseDepth, bx + radius, by + baseDepth);
        shape.lineTo(bx + baseWidth - radius, by + baseDepth);
        shape.quadraticCurveTo(bx + baseWidth, by + baseDepth, bx + baseWidth, by + baseDepth - radius);
        shape.lineTo(bx + baseWidth, by + radius);
        shape.quadraticCurveTo(bx + baseWidth, by, bx + baseWidth - radius, by);
        shape.lineTo(bx + radius, by);
        shape.quadraticCurveTo(bx, by, bx, by + radius);

        const extrudeSettings = { 
          depth: baseHeight, 
          bevelEnabled: true, 
          bevelSegments: 4, 
          steps: 1, 
          bevelSize: 0.04, 
          bevelThickness: 0.04 
        };
        const baseGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        baseGeo.rotateX(-Math.PI / 2); // Lay flat
        const baseMesh = new THREE.Mesh(baseGeo, woodMaterial);
        baseMesh.position.y = 0; // Top is Y=baseHeight
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        turntableGroup.add(baseMesh);

        // 2. Heavy Metal Platter
        const platterX = -1.5;
        const platterZ = 0;
        const platterGeo = new THREE.CylinderGeometry(3.6, 3.6, 0.35, 64);
        const platterMesh = new THREE.Mesh(platterGeo, matteBlackMaterial);
        platterMesh.position.set(platterX, baseHeight + 0.175, platterZ);
        platterMesh.castShadow = true;
        platterMesh.receiveShadow = true;
        turntableGroup.add(platterMesh);

        // Dots on platter edge (Strobe dots)
        for (let i = 0; i < 40; i++) {
          const dotGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
          const dotMesh = new THREE.Mesh(dotGeo, brushedAluminumMaterial);
          const angle = (i / 40) * Math.PI * 2;
          dotMesh.position.set(Math.cos(angle) * 3.58, 0, Math.sin(angle) * 3.58);
          dotMesh.rotation.y = -angle;
          platterMesh.add(dotMesh);
        }

        // 3. Rubber Mat & Record
        const matGeo = new THREE.CylinderGeometry(3.55, 3.55, 0.04, 64);
        const matMesh = new THREE.Mesh(matGeo, rubberMaterial);
        matMesh.position.set(platterX, baseHeight + 0.35 + 0.02, platterZ);
        matMesh.receiveShadow = true;
        turntableGroup.add(matMesh);

        // Base vinyl
        const recordGeo = new THREE.CylinderGeometry(3.4, 3.4, 0.02, 64);
        const recordMaterial = new THREE.MeshStandardMaterial({
          color: 0x070707,
          roughness: 0.2, // Shiny vinyl
          metalness: 0.4
        });
        const recordMesh = new THREE.Mesh(recordGeo, recordMaterial);
        recordMesh.position.set(platterX, baseHeight + 0.39 + 0.01, platterZ);
        recordMesh.castShadow = true;
        turntableGroup.add(recordMesh);

        // High detail Vinyl Grooves
        for (let r = 1.3; r < 3.3; r += 0.05) {
          const ringGeo = new THREE.RingGeometry(r, r + 0.015, 64);
          const ringMat = new THREE.MeshStandardMaterial({ 
            color: 0x050505, roughness: 0.6, metalness: 0.6 
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(platterX, baseHeight + 0.401, platterZ);
          turntableGroup.add(ring);
        }

        // 4. Abstract Art Label & Spindle
        const labelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.02, 64);
        const labelMat = new THREE.MeshStandardMaterial({ color: 0xc94c3c, roughness: 0.9, metalness: 0 }); // Wine red
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(platterX, baseHeight + 0.402, platterZ);
        turntableGroup.add(labelMesh);
        
        // Inner white circle in label
        const innerLabelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 32);
        const innerLabelMat = new THREE.MeshStandardMaterial({ color: 0xffeccc }); 
        const innerLabelMesh = new THREE.Mesh(innerLabelGeo, innerLabelMat);
        innerLabelMesh.position.set(platterX, baseHeight + 0.403, platterZ);
        turntableGroup.add(innerLabelMesh);

        const spindleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 32);
        const spindleMesh = new THREE.Mesh(spindleGeo, brushedAluminumMaterial);
        spindleMesh.position.set(platterX, baseHeight + 0.5, platterZ);
        spindleMesh.castShadow = true;
        turntableGroup.add(spindleMesh);

        // 5. High Fidelity Tonearm Assembly
        const armBaseX = 3.5;
        const armBaseZ = -2.5;

        // Base ring
        const pivotRingGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
        const pivotRingMesh = new THREE.Mesh(pivotRingGeo, brushedAluminumMaterial);
        pivotRingMesh.position.set(armBaseX, baseHeight + 0.05, armBaseZ);
        pivotRingMesh.castShadow = true;
        turntableGroup.add(pivotRingMesh);

        // Pivot Pillar
        const pivotGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32);
        const pivotMesh = new THREE.Mesh(pivotGeo, matteBlackMaterial);
        pivotMesh.position.set(armBaseX, baseHeight + 0.4, armBaseZ);
        pivotMesh.castShadow = true;
        turntableGroup.add(pivotMesh);

        // Counterweight (Detailed with dials)
        const weightGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32);
        const weightMesh = new THREE.Mesh(weightGeo, brushedAluminumMaterial);
        weightMesh.rotation.z = Math.PI / 2;
        weightMesh.rotation.y = Math.PI / 8; // Slight angle
        weightMesh.position.set(armBaseX + 0.7, baseHeight + 0.7, armBaseZ - 0.4);
        weightMesh.castShadow = true;
        
        // Counterweight black dial ring
        const dialGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 32);
        const dialMesh = new THREE.Mesh(dialGeo, matteBlackMaterial);
        weightMesh.add(dialMesh);
        turntableGroup.add(weightMesh);

        // Detailed S-shape Tonearm Tube
        const startPt = new THREE.Vector3(armBaseX, baseHeight + 0.7, armBaseZ);
        const cp1 = new THREE.Vector3(2.5, baseHeight + 0.7, -1.0);
        const cp2 = new THREE.Vector3(1.5, baseHeight + 0.7, 1.0);
        const endPt = new THREE.Vector3(platterX + 3.0, baseHeight + 0.44, platterZ + 0.8); 
        
        const curve = new THREE.CatmullRomCurve3([startPt, cp1, cp2, endPt]);
        const armGeo = new THREE.TubeGeometry(curve, 64, 0.05, 16, false);
        const armMesh = new THREE.Mesh(armGeo, brushedAluminumMaterial);
        armMesh.castShadow = true;
        turntableGroup.add(armMesh);

        // Headshell & Stylus
        const headGroup = new THREE.Group();
        headGroup.position.copy(endPt);
        headGroup.rotation.y = Math.PI / 5; // Angle tangential to grooves
        
        const headGeo = new THREE.BoxGeometry(0.18, 0.1, 0.45);
        const headMesh = new THREE.Mesh(headGeo, matteBlackMaterial);
        headMesh.castShadow = true;
        headGroup.add(headMesh);

        const fingerLiftGeo = new THREE.BoxGeometry(0.25, 0.02, 0.05);
        const fingerLift = new THREE.Mesh(fingerLiftGeo, brushedAluminumMaterial);
        fingerLift.position.set(0.15, -0.05, 0);
        headGroup.add(fingerLift);

        const stylusGeo = new THREE.CylinderGeometry(0.02, 0.01, 0.1, 8);
        const stylusMesh = new THREE.Mesh(stylusGeo, brushedAluminumMaterial);
        stylusMesh.position.set(0, -0.08, 0.15);
        stylusMesh.rotation.x = Math.PI / 8;
        headGroup.add(stylusMesh);

        turntableGroup.add(headGroup);

        // 6. Highly Detailed Knobs
        const createDetailedKnob = (x: number, z: number) => {
          const kGroup = new THREE.Group();
          kGroup.position.set(x, baseHeight, z);

          // Base ring
          const ringGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.04, 32);
          const ringMesh = new THREE.Mesh(ringGeo, brushedAluminumMaterial);
          ringMesh.position.y = 0.02;
          kGroup.add(ringMesh);

          // Main knob body
          const g = new THREE.CylinderGeometry(0.28, 0.28, 0.3, 32);
          const m = new THREE.Mesh(g, brushedAluminumMaterial);
          m.position.y = 0.15;
          m.castShadow = true;
          m.receiveShadow = true;

          // Knurl detail logic (micro grooves along the edges)
          const edgesGeo = new THREE.CylinderGeometry(0.285, 0.285, 0.25, 64);
          const edgesMat = new THREE.MeshStandardMaterial({ 
            color: 0x888888, wireframe: true, transparent: true, opacity: 0.3 
          });
          const edgesMesh = new THREE.Mesh(edgesGeo, edgesMat);
          m.add(edgesMesh);
          kGroup.add(m);

          return kGroup;
        };

        const knob1 = createDetailedKnob(4.2, 3.0);
        turntableGroup.add(knob1);
        
        const knob2 = createDetailedKnob(2.8, 3.0);
        turntableGroup.add(knob2);

        // Power Switch (Classic Toggle)
        const toggleBaseGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32);
        const toggleBaseMesh = new THREE.Mesh(toggleBaseGeo, brushedAluminumMaterial);
        toggleBaseMesh.position.set(1.5, baseHeight + 0.025, 3.0);
        turntableGroup.add(toggleBaseMesh);

        const toggleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16);
        const toggleMesh = new THREE.Mesh(toggleGeo, brushedAluminumMaterial);
        toggleMesh.position.set(1.5, baseHeight + 0.12, 3.0);
        toggleMesh.rotation.x = Math.PI / 6; // Flipped UP
        turntableGroup.add(toggleMesh);

        // LED Indicator
        const ledGeo = new THREE.SphereGeometry(0.04, 16, 16);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0xff3333 }); // Bright red emissive
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(1.5, baseHeight + 0.04, 2.7);
        turntableGroup.add(ledMesh);

        // --- Render Loop ---
        const clock = new THREE.Clock();

        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          const delta = clock.getDelta();
          if (controls) controls.update();
          
          platterMesh.rotation.y -= delta * 0.8;
          matMesh.rotation.y -= delta * 0.8;
          recordMesh.rotation.y -= delta * 0.8;
          labelMesh.rotation.y -= delta * 0.8;
          innerLabelMesh.rotation.y -= delta * 0.8;

          renderer.render(scene, camera);
        };

        animate();

        // --- Resize logic ---
        const handleResize = () => {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          const newAspect = w / h;
          camera.left = -d * newAspect;
          camera.right = d * newAspect;
          camera.top = d;
          camera.bottom = -d;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // Pass back cleanup functions or handle inside the component scope
        (containerRef.current as any)._cleanup = () => {
          cancelAnimationFrame(animationFrameId);
          window.removeEventListener('resize', handleResize);
          if (controls) controls.dispose();
          renderer.dispose();
        };

      } catch (err: any) {
        console.error("ThreeJS Initialization Error:", err);
        setErrorMsg(err.message || "Unknown 3D init error");
      }
    };

    initThreeJS();

    return () => {
      // Execute the cleanup that was attached to the div
      const cleanup = (containerRef.current as any)?._cleanup;
      if (cleanup) cleanup();
      if (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#f0ece1] overflow-hidden font-sans text-black">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-move" />

      {/* Modern Minimalist UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex justify-between items-start z-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-light tracking-tighter text-[#2a2a2a] drop-shadow-md">
            ZENITH <span className="font-bold">M-1</span>
          </h1>
          <p className="text-[#6a6a6a] tracking-widest text-sm uppercase">
            Minimalist Vintage Turntable
          </p>
        </div>
        <div className="text-right flex flex-col gap-2 text-[#4a4a4a]">
          <p className="text-sm border border-[#4a4a4a]/20 px-3 py-1 rounded-full backdrop-blur-sm bg-white/30">
            45 / 33 RPM
          </p>
          <p className="text-xs uppercase tracking-wider opacity-60">
            Interactive Object
          </p>
        </div>
      </div>

      <div className="absolute bottom-12 left-8 pointer-events-none max-w-sm z-10">
        <p className="text-[#3a3a3a] text-sm leading-relaxed backdrop-blur-md bg-white/40 p-5 rounded-2xl border border-white/40 shadow-xl">
          MZ세대를 위한 감각적인 인테리어 오브제. <br />
          따뜻한 월넛 우드와 차가운 브러시드 알루미늄의 대비가 돋보입니다. 
          드래그하여 360도로 감상해보세요.
        </p>
      </div>

      {errorMsg && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-100 text-red-600 p-4 rounded-lg z-50 shadow-2xl">
          Three.js Error: {errorMsg}
        </div>
      )}
    </div>
  );
}
