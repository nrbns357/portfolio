"use client";

import React, { useState, useEffect } from "react";
import { YoutubeHiddenPlayer } from "@/features/vinyl/components/YoutubeHiddenPlayer";
import { VinylCanvas } from "@/features/vinyl/components/VinylCanvas";
import { VinylShelf } from "@/features/vinyl/components/VinylShelf";
import { useVinylState } from "@/features/vinyl/hooks/useVinylState";
import { useVinylAudio } from "@/features/vinyl/hooks/useVinylAudio";
import { Play, Pause, Disc } from "lucide-react";

const INITIAL_RECORDS = [
  {
    id: "1",
    youtubeId: "W9nPn_wlk1U",
    title: "Vintage Jazz Set",
    artist: "Various Artists",
    thumbUrl: "https://img.youtube.com/vi/W9nPn_wlk1U/maxresdefault.jpg"
  },
  {
    id: "2",
    youtubeId: "jfKfPfyJRdk",
    title: "Lofi Hip Hop Radio",
    artist: "Lofi Girl",
    thumbUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg"
  },
  {
    id: "3",
    youtubeId: "5qap5aO4i9A",
    title: "Synthwave Nights",
    artist: "Retro Wave",
    thumbUrl: "https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg"
  }
];

export default function LPPage() {
  const { state, setPlaying, selectVinyl } = useVinylState(INITIAL_RECORDS);
  const { initAudio, setCrackleVolume } = useVinylAudio();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state.isPlaying) {
      initAudio();
      setCrackleVolume(-10); // Subtle crackle
    } else {
      setCrackleVolume(-Infinity);
    }
  }, [state.isPlaying, initAudio, setCrackleVolume]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden text-white font-sans">
      {/* 3D Vinyl Player */}
      <VinylCanvas 
        isPlaying={state.isPlaying} 
        isNeedleDown={state.isNeedleDown}
        labelTextureUrl={state.currentVinyl?.thumbUrl}
      />

      {/* LP Shelf UI */}
      <VinylShelf 
        records={INITIAL_RECORDS} 
        onSelect={selectVinyl} 
      />

      {/* Control UI */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none">
        <h1 className="text-4xl font-light tracking-tighter text-white drop-shadow-md">
           ZENITH <span className="font-bold">M-1</span>
        </h1>
        <p className="text-gray-500 tracking-widest text-[10px] uppercase mt-1">
           Advanced Vinyl Audio Hub
        </p>
        
        {state.currentVinyl && (
          <div className="mt-8 flex items-center gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 pointer-events-auto">
             <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40">
                <img src={state.currentVinyl.thumbUrl} className="w-full h-full object-cover" />
             </div>
             <div>
                <p className="text-xs font-bold truncate w-40">{state.currentVinyl.title}</p>
                <p className="text-[10px] text-gray-400">{state.currentVinyl.artist}</p>
             </div>
             <button 
                onClick={() => setPlaying(!state.isPlaying)}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
             >
                {state.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
             </button>
          </div>
        )}
      </div>

      {/* Audio Engine (Hidden) */}
      {state.currentVinyl && (
        <YoutubeHiddenPlayer 
          videoId={state.currentVinyl.youtubeId} 
          isPlaying={state.isPlaying} 
        />
      )}

      {/* Decorative Bottom Credits */}
      <div className="absolute bottom-8 right-8 z-30 text-[9px] font-mono tracking-widest text-gray-700 uppercase">
          Studio Edition • Build 2026.4
      </div>
    </div>
  );
}
