import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

export const useVinylAudio = () => {
  const noiseRef = useRef<Tone.Noise | null>(null);
  const filterRef = useRef<Tone.AutoFilter | null>(null);
  const isStarted = useRef(false);

  const initAudio = useCallback(async () => {
    if (isStarted.current) return;
    await Tone.start();
    
    // Create subtle vinyl crackle
    noiseRef.current = new Tone.Noise('pink').start();
    filterRef.current = new AutoFilter({
      frequency: 0.1,
      baseFrequency: 500,
      octaves: 2.6,
      filter: { type: 'lowpass' }
    }).toDestination().start();
    
    noiseRef.current.connect(filterRef.current);
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

// Internal fix for Tone.js types if needed
class AutoFilter extends (Tone.AutoFilter as any) {}
