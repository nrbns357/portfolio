"use client";

import React from 'react';
import { VinylItem } from '../types';

interface VinylShelfProps {
  records: VinylItem[];
  currentId?: string;
  onSelect: (vinyl: VinylItem) => void;
}

const VINYL_COLORS = [
  '#e63946', '#2563eb', '#10b981', '#f472b6', '#06b6d4',
  '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7',
];

export const VinylShelf: React.FC<VinylShelfProps> = ({ records, currentId, onSelect }) => {
  if (records.length === 0) return null;

  return (
    <div 
      className="absolute right-0 top-0 bottom-0 z-40 pointer-events-none"
      style={{ width: '140px' }}
    >
      {/* Semi-transparent background strip */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent" />

      {/* Scrollable LP list */}
      <div className="relative h-full flex flex-col justify-center overflow-y-auto scrollbar-hide pointer-events-auto py-6 px-3">
        <div className="flex flex-col gap-4 items-center">
          {records.map((record, idx) => {
            const isActive = record.id === currentId;
            const color = VINYL_COLORS[idx % VINYL_COLORS.length];

            return (
              <button
                key={record.id}
                onClick={() => onSelect(record)}
                className={`
                  relative flex-shrink-0 cursor-pointer
                  transition-all duration-300 focus:outline-none
                  ${isActive ? 'scale-105' : 'hover:scale-[1.03]'}
                `}
                style={{ width: '110px', height: '110px' }}
              >
                {/* Vinyl disc peeking right */}
                <div
                  className={`
                    absolute rounded-full
                    transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                  `}
                  style={{
                    width: '100px',
                    height: '100px',
                    top: '5px',
                    right: isActive ? '-35px' : '-5px',
                    background: `
                      radial-gradient(circle at center,
                        #1a1a1a 0%, #1a1a1a 13%,
                        ${color} 13.5%, ${color} 16%,
                        #0f0f0f 16.5%, #0a0a0a 19%,
                        #0e0e0e 28%, #090909 29%,
                        #0d0d0d 40%, #090909 41%,
                        #0c0c0c 53%, #090909 54%,
                        #0b0b0b 66%, #090909 67%,
                        #0c0c0c 80%, #151515 81%,
                        #1a1a1a 100%
                      )
                    `,
                    boxShadow: isActive 
                      ? `0 0 15px ${color}55` 
                      : '3px 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  {/* Center label */}
                  <div 
                    className="absolute rounded-full overflow-hidden border border-white/10"
                    style={{
                      width: '34%', height: '34%',
                      top: '33%', left: '33%',
                    }}
                  >
                    <img src={record.thumbUrl} alt="" className="w-full h-full object-cover" />
                    <div 
                      className="absolute bg-[#080808] rounded-full"
                      style={{ width: '10%', height: '10%', top: '45%', left: '45%' }}
                    />
                  </div>

                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ 
                        animation: 'spin 3s linear infinite',
                        background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.08) 10deg, transparent 30deg, transparent)',
                      }} 
                    />
                  )}
                </div>

                {/* Album cover */}
                <div
                  className={`
                    relative rounded overflow-hidden
                    ${isActive 
                      ? 'ring-2 ring-white/40 shadow-lg shadow-white/10' 
                      : 'shadow-md shadow-black/50'
                    }
                  `}
                  style={{ width: '110px', height: '110px' }}
                >
                  <img
                    src={record.thumbUrl}
                    alt={record.title}
                    className={`
                      w-full h-full object-cover transition-all duration-300
                      ${isActive ? 'brightness-100' : 'brightness-[0.55] hover:brightness-[0.8]'}
                    `}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
