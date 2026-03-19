import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface TurntableModelProps {
  isPlaying: boolean;
  needleDown: boolean;
  labelTextureUrl?: string;
}

export const TurntableModel = forwardRef((props: TurntableModelProps, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const platterRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Basic setup from the previous procedural logic
    if (!groupRef.current) return;
    
    // ... Material definitions ...
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x452512, roughness: 0.6 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.3 });
    const plasticMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

    // 1. Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(11, 0.8, 8), woodMat);
    base.position.y = -0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    groupRef.current.add(base);

    // 2. Platter
    const platter = new THREE.Group();
    platter.position.set(-1.5, 0, 0);
    platterRef.current = platter;
    groupRef.current.add(platter);
    
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.35, 64), plasticMat);
    disc.position.y = 0.175;
    platter.add(disc);

    // 3. Tonearm
    const armBox = new THREE.Group();
    armBox.position.set(3.5, 0.4, -2.5);
    armRef.current = armBox;
    groupRef.current.add(armBox);

    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32), metalMat);
    armBox.add(pivot);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 16), metalMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-2, 0.3, 0);
    armBox.add(arm);

  }, []);

  useImperativeHandle(ref, () => ({
    update(delta: number) {
      if (props.isPlaying && platterRef.current) {
        platterRef.current.rotation.y -= delta * 1.5;
        if (props.needleDown && armRef.current) {
           armRef.current.rotation.y += (0 - armRef.current.rotation.y) * 5 * delta;
        }
      } else if (armRef.current) {
        armRef.current.rotation.y += (Math.PI / 8 - armRef.current.rotation.y) * 5 * delta;
      }
    }
  }));

  return <group ref={groupRef} />;
});
