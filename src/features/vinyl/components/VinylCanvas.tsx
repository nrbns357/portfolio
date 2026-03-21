"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useVinylScene } from "../hooks/useVinylScene";
import { TurntableModel } from "./TurntableModel";

interface VinylCanvasProps {
  isPlaying: boolean;
  isNeedleDown: boolean;
  labelTextureUrl?: string;
}

export const VinylCanvas: React.FC<VinylCanvasProps> = ({ isPlaying, isNeedleDown, labelTextureUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null);
  const { initScene, renderer, scene } = useVinylScene(containerRef);

  useEffect(() => {
    initScene();
  }, [initScene]);

  // Sync React state with Three.js loop via imperative hook
  useEffect(() => {
    if (!renderer) return;
    
    const clock = new THREE.Clock();
    let frameId: number;

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      const delta = clock.getDelta();
      if (modelRef.current) {
        modelRef.current.update(delta);
      }
    };
    tick();

    return () => cancelAnimationFrame(frameId);
  }, [renderer]);

  return (
    <div ref={containerRef} className="absolute inset-0 cursor-move">
      <TurntableModel 
        ref={modelRef} 
        isPlaying={isPlaying} 
        needleDown={isNeedleDown} 
        labelTextureUrl={labelTextureUrl}
        scene={scene as any}
      />
    </div>
  );
};
