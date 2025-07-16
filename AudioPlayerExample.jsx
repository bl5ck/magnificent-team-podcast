import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import './AudioPlayerExample.css';

// Example usage of the AudioPlayer component
const AudioPlayerExample = () => {
  const [currentEpisode, setCurrentEpisode] = useState(null);

  // Example episode data (you would load this from your playlists.json)
  const exampleEpisode = {
    id: "episode-DockerMCPGateway_SecureAIInfrastructurewav-36151724-1752468273000",
    title: "Docker MCP Gateway_Secure AI Infrastructure",
    source: "AI Daily",
    audioUrl: "https://res.cloudinary.com/dvtckdk3d/raw/upload/podcast/final/DockerMCPGateway_SecureAIInfrastructurewav-36151724-1752468273000/playlist.m3u8"
  };

  const handlePlay = () => {
    console.log('Audio started playing');
  };

  const handlePause = () => {
    console.log('Audio paused');
  };

  const handleEnded = () => {
    console.log('Audio finished playing');
  };

  return (
    <div className="audio-player-example">
      <div className="example-container">
        <h1>Audio Player Example</h1>
        <p>This demonstrates the improved audio player with:</p>
        <ul>
          <li>✅ Immediate play response</li>
          <li>✅ Single loading indicator (no duplicates)</li>
          <li>✅ Integrated force play functionality</li>
          <li>✅ Modern, clean UI</li>
          <li>✅ Error handling and retry logic</li>
        </ul>
        
        <AudioPlayer
          audioUrl={exampleEpisode.audioUrl}
          title={exampleEpisode.title}
          source={exampleEpisode.source}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      </div>
    </div>
  );
};

export default AudioPlayerExample;