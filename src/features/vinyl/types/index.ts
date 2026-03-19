export interface VinylItem {
  id: string;
  youtubeId: string;
  title: string;
  thumbUrl: string;
  artist: string;
}

export interface VinylState {
  currentVinyl: VinylItem | null;
  isPlaying: boolean;
  isNeedleDown: boolean;
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused';
}
