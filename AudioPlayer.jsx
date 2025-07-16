import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({ 
  audioUrl, 
  title, 
  source, 
  onPlay, 
  onPause, 
  onEnded,
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForcePlaying, setIsForcePlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const audioRef = useRef(null);
  const playTimeoutRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  const MAX_RETRIES = 3;
  const LOADING_TIMEOUT = 10000; // 10 seconds
  const FORCE_PLAY_DELAY = 3000; // 3 seconds

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play with retry logic
  const handlePlay = useCallback(async (force = false) => {
    if (!audioRef.current) return;

    try {
      setError(null);
      setIsLoading(true);
      setIsForcePlaying(force);

      // Clear any existing timeouts
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Set loading timeout
      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          setError('Audio loading timeout. Click play again to force play.');
          setIsLoading(false);
        }
      }, LOADING_TIMEOUT);

      // Attempt to play
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        
        // Clear loading timeout on success
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        
        setIsPlaying(true);
        setIsLoading(false);
        setIsForcePlaying(false);
        setRetryCount(0);
        
        if (onPlay) onPlay();
      }
    } catch (error) {
      console.error('Play error:', error);
      
      // Clear loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      setIsLoading(false);
      
      // Handle different error types
      if (error.name === 'NotAllowedError') {
        setError('Please allow audio playback in your browser.');
      } else if (error.name === 'NotSupportedError') {
        setError('Audio format not supported.');
      } else {
        setError('Failed to play audio. Click play again to retry.');
      }
    }
  }, [isLoading, onPlay]);

  // Handle pause
  const handlePause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
      setIsForcePlaying(false);
      
      // Clear timeouts
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      if (onPause) onPause();
    }
  }, [onPause]);

  // Handle play button click
  const handlePlayButtonClick = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      // If there was an error or we're force playing, reset retry count
      if (error || isForcePlaying) {
        setRetryCount(0);
      }
      
      // If we've retried too many times, force play
      const shouldForcePlay = retryCount >= MAX_RETRIES || isForcePlaying;
      handlePlay(shouldForcePlay);
    }
  }, [isPlaying, error, retryCount, isForcePlaying, handlePlay, handlePause]);

  // Handle audio events
  const handleLoadedMetadata = useCallback(() => {
    setDuration(audioRef.current.duration);
    setError(null);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    setCurrentTime(audioRef.current.currentTime);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setIsLoading(false);
    setIsForcePlaying(false);
    setCurrentTime(0);
    if (onEnded) onEnded();
  }, [onEnded]);

  const handleError = useCallback((e) => {
    console.error('Audio error:', e);
    setIsLoading(false);
    setIsPlaying(false);
    setIsForcePlaying(false);
    
    // Clear timeouts
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    setError('Audio playback error. Click play again to retry.');
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleCanPlayThrough = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  // Handle seek
  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [duration]);

  // Handle volume change
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when audio URL changes
  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(false);
    setIsForcePlaying(false);
    setCurrentTime(0);
    setError(null);
    setRetryCount(0);
  }, [audioUrl]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showLoadingSpinner = isLoading && !isPlaying;
  const showForcePlayHint = error && retryCount >= MAX_RETRIES;

  return (
    <div className={`audio-player ${className}`}>
      {/* Title and Source */}
      <div className="audio-player-header">
        <h3 className="audio-player-title">{title}</h3>
        <p className="audio-player-source">{source}</p>
      </div>

      {/* Loading States - Single, clean loading indicator */}
      {showLoadingSpinner && (
        <div className="audio-player-loading">
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <span className="loading-text">
              {isForcePlaying ? 'Force playing...' : 'Loading audio...'}
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="audio-player-error">
          <span className="error-text">{error}</span>
          {showForcePlayHint && (
            <button 
              className="force-play-button"
              onClick={() => handlePlay(true)}
            >
              <span className="force-play-icon">🚀</span>
              Force Play
            </button>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="audio-player-progress">
        <span className="time-display current-time">
          {formatTime(currentTime)}
        </span>
        <div 
          className="progress-bar" 
          onClick={handleSeek}
        >
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="time-display total-time">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="audio-player-controls">
        <button 
          className="control-button previous-button"
          aria-label="Previous track"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        <button 
          className={`play-button ${isPlaying ? 'playing' : ''} ${showLoadingSpinner ? 'loading' : ''}`}
          onClick={handlePlayButtonClick}
          disabled={showLoadingSpinner}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {showLoadingSpinner ? (
            <div className="play-spinner"></div>
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <button 
          className="control-button next-button"
          aria-label="Next track"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>

        <div className="volume-control">
          <button 
            className="volume-button"
            aria-label="Volume"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onCanPlayThrough={handleCanPlayThrough}
        preload="metadata"
      />
    </div>
  );
};

export default AudioPlayer;