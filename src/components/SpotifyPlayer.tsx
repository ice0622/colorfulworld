"use client";

import React from 'react';

interface SpotifyPlayerProps {
  playlistId: string;
  width?: string | number;
  height?: string | number;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ 
  playlistId, 
  width = "100%", 
  height = "352" 
}) => {
  // プレイリストIDを使用してSpotify埋め込みURLを生成
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
  
  return (
    <div className="spotify-player-wrapper my-8">
      <iframe
        style={{ borderRadius: "12px" }}
        src={embedUrl}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen=""
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
};

export default SpotifyPlayer;