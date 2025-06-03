import { useParams } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const WatchPage = () => {

  const { streamId} = useParams();
  console.log('streamId: ',streamId);
  const videoRef = useRef();

  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      const hlsUrl = `http://localhost:8000/media/${streamId}/index.m3u8`;

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play();
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = `http://localhost:8000/media/${streamId}/index.m3u8`;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current.play();
      });
    }
  }, [streamId]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        controls
        autoPlay
        className="w-full max-w-4xl"
      />
    </div>
  );
};

export default WatchPage;
