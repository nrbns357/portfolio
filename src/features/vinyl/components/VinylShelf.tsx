import React from 'react';
import { VinylItem } from '../types';

interface VinylShelfProps {
  records: VinylItem[];
  onSelect: (vinyl: VinylItem) => void;
}

export const VinylShelf: React.FC<VinylShelfProps> = ({ records, onSelect }) => {
  return (
    <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20 overflow-y-auto max-h-[80vh] p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 scrollbar-hide">
      {records.map((record) => (
        <button
          key={record.id}
          onClick={() => onSelect(record)}
          className="group relative w-32 h-32 hover:scale-105 transition-transform"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/30">
            <img 
              src={record.thumbUrl} 
              alt={record.title}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="absolute -bottom-6 left-0 w-full text-[10px] text-gray-500 font-mono truncate uppercase tracking-tighter group-hover:text-white">
            {record.title}
          </p>
        </button>
      ))}
    </div>
  );
};
