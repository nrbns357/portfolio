"use client";

import React, { useState, useEffect, useCallback } from "react";
import { YoutubeHiddenPlayer } from "@/features/vinyl/components/YoutubeHiddenPlayer";
import { VinylCanvas } from "@/features/vinyl/components/VinylCanvas";

import { useVinylState } from "@/features/vinyl/hooks/useVinylState";
import { useVinylAudio } from "@/features/vinyl/hooks/useVinylAudio";
import { Play, Pause, Disc, Plus } from "lucide-react";

export default function LPPage() {
  const [records, setRecords] = useState<Array<{id: string; youtubeId: string; title: string; artist: string; thumbUrl: string}>>([]);
  const [inputValue, setInputValue] = useState("");
  const { state, setPlaying, selectVinyl } = useVinylState([]);
  const { initAudio, setCrackleVolume } = useVinylAudio();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dustCoverOpen, setDustCoverOpen] = useState(true);

  const handleDustCoverToggle = useCallback(() => {
    setDustCoverOpen(prev => !prev);
  }, []);

  useEffect(() => {
    setProgress(0);
  }, [state.currentVinyl]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const match = inputValue.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/|.*shorts\/))([^?&/]+)/);
    if (match && match[1]) {
      const newId = match[1];
      const newRecord = {
        id: Math.random().toString(),
        youtubeId: newId,
        title: "Youtube Track",
        artist: "Custom Link",
        thumbUrl: `https://img.youtube.com/vi/${newId}/hqdefault.jpg`
      };
      setRecords((prev) => [...prev, newRecord]);
      selectVinyl(newRecord);
      setPlaying(false); // Reset playing state before autoplay logic or just stop to let user start
      setInputValue("");
    } else {
      alert("올바른 유튜브 링크가 아닙니다.");
    }
  };

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
        records={records}
        currentId={state.currentVinyl?.id}
        onSelect={selectVinyl}
        progress={progress}
        dustCoverOpen={dustCoverOpen}
        onDustCoverToggle={handleDustCoverToggle}
      />

      {/* Control UI */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none">
        <h1 className="text-4xl font-light tracking-tighter text-white drop-shadow-md">
           ZENITH <span className="font-bold">M-1</span>
        </h1>
        <p className="text-gray-500 tracking-widest text-[10px] uppercase mt-1">
           Advanced Vinyl Audio Hub
        </p>

        {/* URL Input */}
        <form onSubmit={handleAddLink} className="mt-6 flex gap-2 pointer-events-auto">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="유튜브 링크 입력" 
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 w-60 backdrop-blur-md"
          />
          <button type="submit" className="bg-white text-black p-2 rounded-xl hover:scale-105 transition-transform flex items-center justify-center w-10">
            <Plus size={18} />
          </button>
        </form>
        
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
          onProgress={setProgress}
        />
      )}

      {/* Decorative Bottom Credits */}
      <div className="absolute bottom-8 right-8 z-30 text-[9px] font-mono tracking-widest text-gray-700 uppercase">
          Studio Edition • Build 2026.4
      </div>
    </div>
  );
}
