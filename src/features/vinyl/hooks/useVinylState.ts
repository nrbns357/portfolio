import { useState, useCallback } from 'react';
import { VinylItem, VinylState } from '../types';

export const useVinylState = (initialRecords: VinylItem[]) => {
  const [state, setState] = useState<VinylState>({
    currentVinyl: initialRecords[0] || null,
    isPlaying: false,
    isNeedleDown: false,
    status: 'idle',
  });

  const setPlaying = useCallback((playing: boolean) => {
    setState((prev) => ({ ...prev, isPlaying: playing, isNeedleDown: playing }));
  }, []);

  const selectVinyl = useCallback((vinyl: VinylItem) => {
    setState((prev) => ({ ...prev, currentVinyl: vinyl, isPlaying: false, isNeedleDown: false }));
  }, []);

  return { state, setPlaying, selectVinyl };
};
