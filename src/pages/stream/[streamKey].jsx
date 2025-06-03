
import { useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const WatchPage = () => {
    const  {streamKey}  = useParams();
    const videoRef = useRef();
    const hlsRef = useRef();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [streamStatus, setStreamStatus] = useState('connecting');

    console.log('streamKey: ', streamKey);

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 10;
        const retryDelay = 2000;

        const initializePlayer = () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }

            const hlsUrl = `http://localhost:5000/media/${streamKey}/index.m3u8`;
            console.log('Loading HLS URL:', hlsUrl);

            if (Hls.isSupported()) {
                const hls = new Hls({
                    debug: true,
                    enableWorker: false,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    liveSyncDurationCount: 3,
                    liveMaxLatencyDurationCount: 5,
                    liveDurationInfinity: true,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 600,
                    maxBufferSize: 60 * 1000 * 1000,
                    maxBufferHole: 0.5,
                    manifestLoadingTimeOut: 20000,
                    manifestLoadingMaxRetry: 4,
                    manifestLoadingRetryDelay: 2000,
                    levelLoadingTimeOut: 20000,
                    levelLoadingMaxRetry: 4,
                    levelLoadingRetryDelay: 2000,
                    fragLoadingTimeOut: 20000,
                    fragLoadingMaxRetry: 6,
                    fragLoadingRetryDelay: 2000,
                });

                hlsRef.current = hls;

                // Error handling
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS Error:', data);
                    
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('Network error, trying to recover...');
                                if (retryCount < maxRetries) {
                                    setTimeout(() => {
                                        retryCount++;
                                        setStreamStatus('reconnecting');
                                        hls.startLoad();
                                    }, retryDelay);
                                } else {
                                    setError('Network error: Unable to load stream');
                                    setStreamStatus('error');
                                }
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log('Media error, trying to recover...');
                                hls.recoverMediaError();
                                break;
                            default:
                                setError('Fatal error occurred');
                                setStreamStatus('error');
                                break;
                        }
                    }
                });

                // Loading events
                hls.on(Hls.Events.MANIFEST_LOADING, () => {
                    console.log('Loading manifest...');
                    setStreamStatus('loading');
                });

                hls.on(Hls.Events.MANIFEST_LOADED, () => {
                    console.log('Manifest loaded successfully');
                    setStreamStatus('loaded');
                });

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('Manifest parsed, starting playback...');
                    setIsLoading(false);
                    setStreamStatus('playing');
                    
                    if (videoRef.current) {
                        videoRef.current.play().catch(e => {
                            console.log('Auto-play prevented:', e);
                            setStreamStatus('ready');
                        });
                    }
                });

                // Fragment loading events
                hls.on(Hls.Events.FRAG_LOADING, (event, data) => {
                    console.log(`Loading fragment: ${data.frag.url}`);
                });

                hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
                    console.log(`Fragment loaded: ${data.frag.url}`);
                    retryCount = 0; // Reset retry count on successful load
                });

                // Level events
                hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
                    console.log('Level loaded:', data);
                });

                // Load source and attach to video
                hls.loadSource(hlsUrl);
                hls.attachMedia(videoRef.current);

            } else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
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

        // Initial load
        initializePlayer();

        // Cleanup function
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [streamKey]);

    // Video event handlers
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
        setStreamStatus('loading');
    };

    const renderStatusMessage = () => {
        switch (streamStatus) {
            case 'connecting':
                return <div className="text-blue-400">Connecting to stream...</div>;
            case 'loading':
                return <div className="text-blue-400">Loading stream...</div>;
            case 'buffering':
                return <div className="text-yellow-400">Buffering...</div>;
            case 'reconnecting':
                return <div className="text-yellow-400">Reconnecting...</div>;
            case 'ready':
                return <div className="text-green-400">Stream ready - Click play to start</div>;
            case 'playing':
                return null;
            case 'error':
                return <div className="text-red-400">Error: {error}</div>;
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
                            {isLoading && !error && (
                                <div className="mt-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
                Stream ID: {streamKey} | Status: {streamStatus}
            </div>
        </div>
    );
};

export default WatchPage;