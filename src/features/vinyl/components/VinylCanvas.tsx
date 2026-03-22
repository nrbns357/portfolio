"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useVinylScene } from "../hooks/useVinylScene";
import { TurntableModel } from "./TurntableModel";
import { VinylItem } from "../types";

interface VinylCanvasProps {
  isPlaying: boolean;
  isNeedleDown: boolean;
  labelTextureUrl?: string;
  records: VinylItem[];
  currentId?: string;
  onSelect: (vinyl: VinylItem) => void;
  progress?: number;
  dustCoverOpen?: boolean;
  onDustCoverToggle?: () => void;
}

export const VinylCanvas: React.FC<VinylCanvasProps> = ({ 
  isPlaying, 
  isNeedleDown, 
  labelTextureUrl,
  records,
  currentId,
  onSelect,
  progress,
  dustCoverOpen,
  onDustCoverToggle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null);
  const { scene, camera, renderer } = useVinylScene(containerRef);

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
    <div ref={containerRef} className="absolute inset-0 cursor-move w-full h-full">
      {scene && camera && renderer && (
        <TurntableModel 
          ref={modelRef} 
          isPlaying={isPlaying} 
          needleDown={isNeedleDown} 
          labelTextureUrl={labelTextureUrl}
          scene={scene}
          camera={camera}
          renderer={renderer}
          records={records}
          currentId={currentId}
          onSelect={onSelect}
          progress={progress}
          dustCoverOpen={dustCoverOpen}
          onDustCoverToggle={onDustCoverToggle}
        />
      )}
    </div>
  );
};
