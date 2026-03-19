"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  Music, 
  Hand, 
  Disc, 
  ArrowUpRight, 
  Cpu, 
  Waves, 
  Layers, 
  Plus,
  Sparkles as SparklesIcon
} from "lucide-react";

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const projects = [
    {
      title: "Zenith Turntable",
      tagline: "3D Interaction",
      desc: "물리 기반 렌더링으로 구현된 3D 턴테이블 시뮬레이션.",
      href: "/LP",
      icon: Disc,
      color: "from-orange-500/20 to-amber-500/10",
    },
    {
      title: "Hand Space",
      tagline: "Spatial UI",
      desc: "실시간 핸드 트래킹 공간 지능형 UI.",
      href: "/hand-gesture",
      icon: Hand,
      color: "from-purple-500/20 to-pink-500/10",
    },
    {
      title: "Audio Engine",
      tagline: "Web Audio",
      desc: "브라우저 기반 실시간 베이스기타 합성 오디오 엔진.",
      href: "/bass-guitar",
      icon: Music,
      color: "from-blue-500/20 to-cyan-500/10",
    },
  ];

  // Capitalized components for JSX compatibility
  const Icon1 = projects[0].icon;
  const Icon2 = projects[1].icon;
  const Icon3 = projects[2].icon;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#030303] flex flex-col items-center overflow-x-hidden text-white sm:p-0 p-4"
    >
      {/* Background Layers */}
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />
      
      {/* Spotlight Effect */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(1000px circle at ${mousePos.x}px ${mousePos.y}px, rgba(120, 119, 198, 0.15), transparent 70%)`
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 w-full max-w-7xl px-6 flex flex-col items-center z-10">
        <div className="flex items-center gap-3 px-3 py-1 mb-8 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md animate-fade-in">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] tracking-[0.2em] font-medium text-gray-400 uppercase">
            Creative Development Workspace
          </span>
          <Plus className="w-2.5 h-2.5 text-white/20" />
        </div>

        <h1 className="text-center text-7xl md:text-9xl font-extrabold tracking-tighter leading-[0.85] mb-12">
          CRAFTED<br />
          <span className="text-gray-500/30">EXPERIENCE</span>
        </h1>

        <p className="max-w-xl text-center text-gray-400 font-light leading-relaxed">
           Three.js와 최신 웹 기술을 결합하여 경계를 허무는 웹 경험을 창조합니다.
        </p>
      </section>

      {/* Bento Grid Projects */}
      <section className="relative z-20 w-full max-w-7xl px-6 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Link 
            href={projects[0].href}
            className="md:col-span-2 group relative overflow-hidden h-96 rounded-[2rem] border border-white/5 bg-[#0a0a0a] hover:bg-[#0c0c0c] transition-all duration-500"
          >
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${projects[0].color} rounded-full blur-[100px] opacity-20`} />
            <div className="p-10 h-full flex flex-col justify-between relative z-10">
              <div className="space-y-4">
                <span className="text-xs font-mono text-gray-500">{projects[0].tagline}</span>
                <h2 className="text-4xl font-bold">{projects[0].title}</h2>
                <p className="text-gray-500 max-w-sm">{projects[0].desc}</p>
              </div>
              <Icon1 className="w-16 h-16 text-white/5 self-end" />
            </div>
          </Link>

          <Link 
            href={projects[1].href}
            className="group relative overflow-hidden h-96 rounded-[2rem] border border-white/5 bg-[#0a0a0a] hover:bg-[#0c0c0c] transition-all duration-500"
          >
            <div className="p-10 h-full flex flex-col justify-between relative z-10">
               <div>
                 <span className="text-xs font-mono text-gray-500">{projects[1].tagline}</span>
                 <h3 className="text-2xl font-bold mt-2">{projects[1].title}</h3>
               </div>
               <Icon2 className="w-12 h-12 text-white/10" />
            </div>
          </Link>

          <Link 
            href={projects[2].href}
            className="group relative overflow-hidden h-64 rounded-[2rem] border border-white/5 bg-[#0a0a0a] hover:bg-[#0c0c0c] transition-all duration-500"
          >
            <div className="p-8 h-full flex justify-between items-center">
              <h3 className="text-xl font-bold">{projects[2].title}</h3>
              <Icon3 className="w-8 h-8 text-white/10" />
            </div>
          </Link>

          <div className="md:col-span-2 rounded-[2rem] border border-white/5 bg-[#0a0a0a] p-8 flex justify-between items-center h-64">
             <div className="space-y-4">
               <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-gray-500 tracking-widest">SYSTEM ACTIVE</span>
               </div>
               <p className="text-xs text-gray-600 max-w-xs uppercase leading-relaxed font-mono">
                  Optimized for WebGPU and 144Hz displays with high-precision audio rendering.
               </p>
             </div>
             <div className="grid grid-cols-2 gap-4 opacity-10">
               <Waves /> <Layers /> <Cpu /> <SparklesIcon />
             </div>
          </div>

        </div>
      </section>

      <footer className="w-full max-w-7xl px-10 py-12 flex justify-between border-t border-white/5 text-[9px] tracking-widest text-gray-600 uppercase font-mono">
         <span>© WORKSPACE 2026</span>
         <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Github</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
         </div>
      </footer>
    </div>
  );
}
