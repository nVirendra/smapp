import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import axios from 'axios';

const WatchPage = () => {
  const { streamKey } = useParams();
  const videoRef = useRef();
  const hlsRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamStatus, setStreamStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 20;
  const retryDelay = 3000;

  console.log('streamKey: ', streamKey);

  // 🔍 Check if stream is available
  const checkStreamAvailability = async () => {
    try {
      // First check our API
      const response = await axios.get(`http://localhost:5000/api/streams/${streamKey}/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking stream status:', error);
      
      // Fallback: try to access HLS directly
      try {
        const hlsUrl = `http://localhost:5000/live/${streamKey}/index.m3u8`;
        const hlsResponse = await fetch(hlsUrl, { method: 'HEAD' });
        if (hlsResponse.ok) {
          return { status: 'live', hlsUrl: hlsUrl };
        }
      } catch (hlsError) {
        console.log('HLS file not available yet');
      }
      
      return { status: 'offline', hlsUrl: null };
    }
  };

  // 🎥 Initialize HLS player
  const initializePlayer = (hlsUrl) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    console.log('Loading HLS URL:', hlsUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false, // Set to true for debugging
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 30,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 4,
        liveDurationInfinity: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 6,
        levelLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 8,
        fragLoadingRetryDelay: 1000,
      });

      hlsRef.current = hls;

      // 🔥 Enhanced error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...');
              if (retryCount < maxRetries) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                  setStreamStatus('reconnecting');
                  hls.startLoad();
                }, retryDelay);
              } else {
                setError('Network error: Unable to load stream after multiple attempts');
                setStreamStatus('error');
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              setError(`Fatal error: ${data.details}`);
              setStreamStatus('error');
              break;
          }
        } else {
          // Non-fatal errors
          console.warn('Non-fatal HLS error:', data.details);
        }
      });

      // 📊 Loading events
      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        console.log('Loading manifest...');
        setStreamStatus('loading');
      });

      hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
        console.log('Manifest loaded successfully');
        setStreamStatus('loaded');
        setRetryCount(0); // Reset retry count on successful load
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('Manifest parsed, starting playback...');
        setIsLoading(false);
        setStreamStatus('ready');

        if (videoRef.current) {
          videoRef.current.play().catch((e) => {
            console.log('Auto-play prevented:', e);
            setStreamStatus('ready');
          });
        }
      });

      // 📦 Fragment events
      hls.on(Hls.Events.FRAG_LOADING, (event, data) => {
        console.log(`Loading fragment: ${data.frag.sn}`);
      });

      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        console.log(`Fragment loaded: ${data.frag.sn}`);
        setRetryCount(0); // Reset on successful fragment load
      });

      // 🎬 Playback events
      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('Level loaded, live:', data.details.live);
      });

      // Load source and attach to video
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
    } else if (
      videoRef.current &&
      videoRef.current.canPlayType('application/vnd.apple.mpegurl')
    ) {
      // Safari native HLS support
      console.log('Using native HLS support');
      videoRef.current.src = hlsUrl;

      videoRef.current.addEventListener('loadedmetadata', () => {
        console.log('Native HLS loaded');
        setIsLoading(false);
        setStreamStatus('ready');
      });

      videoRef.current.addEventListener('error', (e) => {
        console.error('Native HLS error:', e);
        setError('Error loading stream');
        setStreamStatus('error');
      });
    } else {
      setError('HLS is not supported in this browser');
      setStreamStatus('error');
    }
  };

  // 🔄 Main effect to handle stream loading
  useEffect(() => {
    let checkInterval;
    let mounted = true;

    const startStreamCheck = async () => {
      setStreamStatus('checking');
      
      const checkStream = async () => {
        if (!mounted) return;
        
        const streamData = await checkStreamAvailability();
        
        if (streamData.status === 'live' && streamData.hlsUrl) {
          console.log('✅ Stream is live, initializing player');
          setStreamStatus('connecting');
          initializePlayer(streamData.hlsUrl);
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        } else {
          console.log('⏳ Stream not available yet, retrying...');
          setStreamStatus('waiting');
          
          if (retryCount >= maxRetries) {
            setError('Stream is not available. The broadcaster may not be live.');
            setStreamStatus('error');
            if (checkInterval) {
              clearInterval(checkInterval);
            }
          }
        }
      };

      // Initial check
      await checkStream();
      
      // Set up interval to keep checking if stream isn't live yet
      if (mounted) {
        checkInterval = setInterval(checkStream, retryDelay);
      }
    };

    startStreamCheck();

    // Cleanup function
    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamKey]);

  // 🎥 Video event handlers
  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setError('Video playback error');
    setStreamStatus('error');
  };

  const handleVideoWaiting = () => {
    console.log('Video waiting for data...');
    setStreamStatus('buffering');
  };

  const handleVideoPlaying = () => {
    console.log('Video playing');
    setStreamStatus('playing');
  };

  const handleVideoLoadStart = () => {
    console.log('Video load start');
    if (streamStatus !== 'playing') {
      setStreamStatus('loading');
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setIsLoading(true);
    
    // Re-trigger the effect
    const event = new CustomEvent('retry');
    window.dispatchEvent(event);
    window.location.reload(); // Simple way to restart
  };

  // 🎨 Render status message
  const renderStatusMessage = () => {
    switch (streamStatus) {
      case 'checking':
        return <div className="text-blue-400">Checking stream availability...</div>;
      case 'waiting':
        return <div className="text-yellow-400">Waiting for stream to start... (Attempt {retryCount + 1}/{maxRetries})</div>;
      case 'connecting':
        return <div className="text-blue-400">Connecting to stream...</div>;
      case 'loading':
        return <div className="text-blue-400">Loading stream...</div>;
      case 'buffering':
        return <div className="text-yellow-400">Buffering...</div>;
      case 'reconnecting':
        return <div className="text-yellow-400">Reconnecting... (Attempt {retryCount + 1}/{maxRetries})</div>;
      case 'ready':
        return (
          <div className="text-green-400">
            Stream ready - Click play to start
          </div>
        );
      case 'playing':
        return null;
      case 'error':
        return (
          <div className="text-red-400">
            <div>Error: {error}</div>
            <button 
              onClick={handleRetry}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Retry
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
      <div className="w-full max-w-4xl relative">
        <video
          ref={videoRef}
          controls
          autoPlay
          muted
          playsInline
          className="w-full h-auto"
          onError={handleVideoError}
          onWaiting={handleVideoWaiting}
          onPlaying={handleVideoPlaying}
          onLoadStart={handleVideoLoadStart}
        />

        {(isLoading || error || streamStatus !== 'playing') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center">
              {renderStatusMessage()}
              {(isLoading || streamStatus === 'checking' || streamStatus === 'waiting' || streamStatus === 'connecting') && !error && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-400 text-center">
        <p>Stream ID: {streamKey}</p>
        <p>Status: {streamStatus}</p>
        {retryCount > 0 && (
          <p>Retry attempts: {retryCount}/{maxRetries}</p>
        )}
      </div>
    </div>
  );
};

export default WatchPage;