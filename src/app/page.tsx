"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RoomCanvas } from "@/features/room/components/RoomCanvas";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen bg-[#080810] overflow-hidden text-white font-sans">
      {/* 3D Isometric Room */}
      <RoomCanvas onNavigate={handleNavigate} />

      {/* UI Overlay — Top Left */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] tracking-[0.3em] font-mono text-gray-500 uppercase">
            System Online
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.85]">
          HYUNHO
          <br />
          <span className="text-white/15">STUDIO</span>
        </h1>

        <p className="mt-4 text-gray-500 text-sm max-w-xs leading-relaxed font-light">
          오브젝트를 클릭하여
          <br />
          프로젝트를 탐험하세요.
        </p>

        {/* Legend */}
        <div className="mt-8 space-y-2.5">
          {[
            { color: "bg-red-500/60", label: "LP 스테이션", hint: "음악 경험" },
            { color: "bg-blue-500/60", label: "모니터", hint: "프로젝트 목록" },
            { color: "bg-amber-500/60", label: "베이스 기타", hint: "오디오 엔진" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
              <span className="text-[10px] font-mono text-gray-500 tracking-wider">{item.label}</span>
              <span className="text-[9px] text-gray-700">— {item.hint}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom credits */}
      <div className="absolute bottom-6 right-8 z-30 flex items-center gap-4 text-[8px] font-mono tracking-[0.2em] text-gray-700 uppercase">
        <span>Portfolio 2026</span>
        <span className="text-gray-800">·</span>
        <span>Built with Three.js</span>
      </div>

      {/* Bottom-left hint */}
      <div className="absolute bottom-6 left-8 z-30 text-[9px] text-gray-600 font-mono tracking-wider animate-pulse">
        ↻ 드래그하여 카메라 회전
      </div>
    </div>
  );
}
