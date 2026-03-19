import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

interface YoutubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: () => void;
  onEnd?: () => void;
}

export const YoutubeHiddenPlayer: React.FC<YoutubePlayerProps> = ({ videoId, isPlaying, onReady, onEnd }) => {
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
        onReady={(e) => {
          playerRef.current = e.target;
          onReady?.();
        }}
        onEnd={onEnd}
      />
    </div>
  );
};
