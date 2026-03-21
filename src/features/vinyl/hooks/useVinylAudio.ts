import { useEffect, useRef, useCallback } from 'react';
import type * as Tone from 'tone';

export const useVinylAudio = () => {
  const noiseRef = useRef<Tone.Noise | null>(null);
  const filterRef = useRef<Tone.AutoFilter | null>(null);
  const isStarted = useRef(false);

  const initAudio = useCallback(async () => {
    if (isStarted.current || typeof window === 'undefined') return;
    const ToneModule = await import('tone');
    await ToneModule.start();
    
    // Create subtle vinyl crackle
    noiseRef.current = new ToneModule.Noise('pink').start();
    
    filterRef.current = new ToneModule.AutoFilter({
      frequency: 0.1,
      baseFrequency: 500,
      octaves: 2.6,
      filter: { type: 'lowpass' }
    } as any).toDestination().start() as any;
    
    if (filterRef.current) {
      noiseRef.current.connect(filterRef.current as any);
    }
    
    noiseRef.current.volume.value = -Infinity; // Start silent

    isStarted.current = true;
  }, []);

  const setCrackleVolume = useCallback((vol: number) => {
    if (noiseRef.current) {
      noiseRef.current.volume.rampTo(vol, 0.5);
    }
  }, []);

  useEffect(() => {
    return () => {
      noiseRef.current?.dispose();
      filterRef.current?.dispose();
    };
  }, []);

  return { initAudio, setCrackleVolume };
};
