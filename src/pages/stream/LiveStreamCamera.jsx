import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';
import { useSocket } from '../../lib/socket';

const LiveStreamCamera = () => {
  const socket = useSocket();
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const isStreamingRef = useRef(false);
  const streamDataRef = useRef(null);
  const chunkSequenceRef = useRef(0);
  const streamStartedRef = useRef(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [streamStats, setStreamStats] = useState({
    chunkssent: 0,
    totalBytes: 0,
    errors: 0
  });

  React.useEffect(() => {
    const fetchFirstStream = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/streams/live', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.length > 0) {
          const firstLiveStream = response.data[0];
          setStreamData({
            streamId: firstLiveStream._id,
            title: firstLiveStream.title,
            streamKey: firstLiveStream.streamKey,
            rtmpUrl: firstLiveStream.rtmpUrl,
            playbackUrl: firstLiveStream.playbackUrl,
            status: firstLiveStream.status
          });
          streamDataRef.current = firstLiveStream;
        } else {
          console.log('ℹ️ No live streams available');
        }
      } catch (err) {
        console.error('❌ Failed to fetch live streams:', err);
      }
    };

    fetchFirstStream();
  }, []);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

  const handleCreateStream = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/streams/create',
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('on create live stream', response.data);
      setStreamData(response.data);
      streamDataRef.current = response.data;
      alert('Stream created successfully!');
    } catch (error) {
      console.error('Create stream error:', error);
      alert('Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  const startStreaming = async () => {
    try {
      setConnectionStatus('connecting');
      const token = localStorage.getItem('token');

      await axios.put(
        `http://localhost:5000/api/streams/${streamData.streamId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const stream = webcamRef.current?.stream;
      if (!stream) {
        alert('Camera not accessible');
        setConnectionStatus('error');
        return;
      }

      setIsStreaming(true);
      isStreamingRef.current = true;
      streamStartedRef.current = false; // Reset for new stream
      chunkSequenceRef.current = 0; // Reset sequence
      
      // Reset stats
      setStreamStats({
        chunksent: 0,
        totalBytes: 0,
        errors: 0
      });

      await startWebRTCStreaming(socket);
    } catch (err) {
      console.error('Start streaming error:', err);
      setConnectionStatus('error');
    }
  };

  const startWebRTCStreaming = async (socket) => {
    try {
      if (!socket) {
        console.error('Socket not available');
        setConnectionStatus('error');
        return;
      }

      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      webcamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          console.log('Sending chunk:', e.data.size);
          e.data.arrayBuffer().then((buffer) => {
            socket.emit('stream-chunk', {
              streamKey: streamDataRef.current?.streamKey,
              chunk: buffer,
            });
          });
        }
      };

      
      mediaRecorderRef.current.onstart = () => {
        console.log('🎬 MediaRecorder started');
        setConnectionStatus('connected');
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('🔥 MediaRecorder error:', event.error);
        setConnectionStatus('error');
        setStreamStats(prev => ({
          ...prev,
          errors: prev.errors + 1
        }));
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
        setConnectionStatus('disconnected');
      };

      // 🚀 Start recording with 1-second intervals for good balance
      mediaRecorder.start(1000);

      console.log('📡 MediaRecorder started with socket.io streaming');
    } catch (err) {
      console.error('WebRTC streaming error:', err);
      setConnectionStatus('error');
      throw err;
    }
  };

  const stopStreaming = async () => {
    try {
      console.log('🛑 Stopping stream...');

      setIsStreaming(false);
      isStreamingRef.current = false;
      setConnectionStatus('disconnecting');

      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        
        // Send stream-end event
        if (socket && streamDataRef.current?.streamKey) {
          socket.emit('stream-end', {
            streamKey: streamDataRef.current.streamKey
          });
        }
      }

      // Update stream status on server
      if (streamData?.streamId) {
        const token = localStorage.getItem('token');
        await axios.put(
          `http://localhost:5000/api/streams/${streamData.streamId}/end`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Reset refs
      mediaRecorderRef.current = null;
      streamStartedRef.current = false;
      chunkSequenceRef.current = 0;

      setConnectionStatus('disconnected');
      console.log('✅ Stream stopped successfully');
    } catch (err) {
      console.error('Stop streaming error:', err);
      setConnectionStatus('error');
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up...');
      isStreamingRef.current = false;
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (socket && streamDataRef.current?.streamKey) {
        socket.emit('stream-end', {
          streamKey: streamDataRef.current.streamKey
        });
      }
    };
  }, [socket]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'sending':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'disconnecting':
        return 'text-orange-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢 Connected';
      case 'connecting':
        return '🟡 Connecting...';
      case 'sending':
        return '🔵 Sending...';
      case 'error':
        return '🔴 Connection Error';
      case 'disconnecting':
        return '🟠 Disconnecting...';
      default:
        return '⚫ Disconnected';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        {!streamData ? (
          <div className="bg-white shadow-lg rounded-xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Create Live Stream
            </h2>
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter your stream title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={4}
                  placeholder="Describe your stream..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Stream'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {streamData.title}
                </h2>
                <p
                  className={`text-sm font-medium ${
                    isStreaming ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {isStreaming ? '🔴 LIVE' : '⚫ Not Streaming'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
                {isStreaming && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sending video chunks every 1s
                  </p>
                )}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-black">
              <Webcam
                audio={true}
                height={720}
                width={1280}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="flex justify-center space-x-4">
              {!isStreaming ? (
                <button
                  onClick={startStreaming}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  🎥 Start Live Stream
                </button>
              ) : (
                <button
                  onClick={stopStreaming}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  ⏹️ Stop Stream
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-800">Stream URL:</span>
                <code className="ml-2 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                  {streamData.playbackUrl}
                </code>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-800">Stream Key:</span>
                <code className="ml-2 text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs">
                  {streamData.streamKey}
                </code>
              </div>
            </div>

            {/* Stream Statistics */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                📊 Stream Statistics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm text-blue-700">
                <div>
                  <p className="font-medium">Chunks Sent</p>
                  <p className="text-lg">{streamStats.chunkssent}</p>
                </div>
                <div>
                  <p className="font-medium">Total Data</p>
                  <p className="text-lg">{(streamStats.totalBytes / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="font-medium">Errors</p>
                  <p className="text-lg">{streamStats.errors}</p>
                </div>
              </div>
            </div>

            {/* Debug Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                🔧 Debug Information
              </h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>State:</strong> {isStreaming ? 'Streaming' : 'Not Streaming'}</p>
                <p><strong>Ref:</strong> {isStreamingRef.current ? 'Streaming' : 'Not Streaming'}</p>
                <p><strong>Connection:</strong> {connectionStatus}</p>
                <p><strong>Recorder:</strong> {mediaRecorderRef.current ? 
                  `Active (${mediaRecorderRef.current.state})` : 'Inactive'}</p>
                <p><strong>Socket:</strong> {socket ? 'Connected' : 'Disconnected'}</p>
                <p><strong>Stream Started:</strong> {streamStartedRef.current ? 'Yes' : 'No'}</p>
                <p><strong>Current Sequence:</strong> {chunkSequenceRef.current}</p>
                {streamData && (
                  <p><strong>Stream Key:</strong> {streamData.streamKey}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LiveStreamCamera;