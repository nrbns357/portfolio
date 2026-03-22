"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useRoomScene } from "../hooks/useRoomScene";
import { IsometricRoom } from "./IsometricRoom";

interface RoomCanvasProps {
  onNavigate: (path: string) => void;
}

export const RoomCanvas: React.FC<RoomCanvasProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null);
  const { scene, camera, renderer } = useRoomScene(containerRef);

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
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {scene && camera && renderer && (
        <IsometricRoom
          ref={modelRef}
          scene={scene}
          camera={camera}
          renderer={renderer}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
