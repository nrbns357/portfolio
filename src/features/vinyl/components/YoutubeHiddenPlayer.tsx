import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

interface YoutubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: () => void;
  onEnd?: () => void;
  onProgress?: (progress: number) => void;
}

export const YoutubeHiddenPlayer: React.FC<YoutubePlayerProps> = ({ videoId, isPlaying, onReady, onEnd, onProgress }) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && onProgress) {
      interval = setInterval(() => {
        if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (duration > 0) {
            onProgress(currentTime / duration);
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, onProgress]);

  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div style={{ display: 'none' }}>
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={(e: any) => {
          playerRef.current = e.target;
          onReady?.();
        }}
        onEnd={onEnd}
      />
    </div>
  );
};
