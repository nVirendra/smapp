import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';

const WatchStream = () => {
  const videoRef = useRef();
  const { streamKey } = useParams();

  useEffect(() => {
    if (!streamKey || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(`http://localhost:5000/hls/${streamKey}/index.m3u8`);
      hls.attachMedia(video);

      return () => {
        hls.destroy(); // Cleanup
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = `http://localhost:5000/hls/${streamKey}/index.m3u8`;
    }
  }, [streamKey]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-6 bg-white shadow-xl rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          🎬 Watching Live Stream
        </h2>

        <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden shadow-md border border-gray-300">
          <video
            ref={videoRef}
            controls
            autoPlay
            muted={false}
            className="w-full h-full rounded-md"
          />
        </div>

        <p className="text-center text-sm text-gray-600">
          Stream key: <span className="font-mono text-blue-600">{streamKey}</span>
        </p>
      </div>
    </div>
  );
};

export default WatchStream;
