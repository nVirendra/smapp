import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import RecordRTC from 'recordrtc';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';

const LiveStreamCamera = () => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunkIntervalRef = useRef(null);
    const isStreamingRef = useRef(false); // Use ref to avoid closure issues
    const streamDataRef = useRef(null);
    
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamData, setStreamData] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isCreatingStream, setIsCreatingStream] = useState(false);
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
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

    const sendVideoChunk = useCallback(async (blob) => {
        if (!streamDataRef.current) {
            console.error('No stream data available');
            return;
        }

        try {
            // console.log('Sending video chunk of size:', blob.size);
            setConnectionStatus('sending');
            
            const formData = new FormData();
            formData.append('videoChunk', blob, `chunk-${Date.now()}.webm`);
            formData.append('streamKey', streamDataRef.current.streamKey);
            formData.append('timestamp', Date.now().toString());
            
            // Debug: log formData content
            // for (let [key, value] of formData.entries()) {
            //     console.log(`${key}:`, value);
            // }

            const response = await axios.post('http://localhost:5000/api/streams/chunk', formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                timeout: 10000
            });

            // console.log('Chunk sent successfully:', response.status);
            setConnectionStatus('connected');

        } catch (error) {
            console.error('Send chunk error:', error.response?.data || error.message);
            setConnectionStatus('error');
            
            // Don't stop streaming for temporary network errors
            if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
                console.log('Temporary error, continuing stream...');
                setTimeout(() => setConnectionStatus('connected'), 3000);
            }
        }
    }, []);

    const startStreaming = async () => {
        try {
            // console.log('Starting stream...');
            setConnectionStatus('connecting');
            
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/streams/${streamData.streamId}/start`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            
            const stream = webcamRef.current?.stream;
            if (!stream) {
                alert('Camera not accessible');
                setConnectionStatus('error');
                return;
            }
            
            // Update both state and ref
            setIsStreaming(true);
            isStreamingRef.current = true;
            streamDataRef.current = streamData;
            
            // console.log('Starting WebRTC streaming...');
            await startWebRTCStreaming(stream);
            
        } catch (error) {
            console.error('Start streaming error:', error);
            alert('Failed to start streaming');
            setConnectionStatus('error');
            setIsStreaming(false);
            isStreamingRef.current = false;
        }
    };

    const startWebRTCStreaming = async (stream) => {
        try {
            // console.log('Initializing WebRTC streaming...');
            
            // Create recorder with proper configuration
            const recorder = new RecordRTC(stream, {
                type: 'video',
                mimeType: 'video/webm;codecs=vp8',
                videoBitsPerSecond: 1000000,
                frameInterval: 33, // ~30fps
                canvas: { 
                    width: 1280, 
                    height: 720 
                },
                // Important: Don't use timeSlice with manual interval approach
                disableLogs: false
            });

            mediaRecorderRef.current = recorder;
            recorder.startRecording();
            
            // console.log('Recording started, setting up chunk interval...');
            setConnectionStatus('connected');

            // Use a more reliable interval-based approach
            const sendChunks = () => {
                // console.log('Interval triggered. isStreaming:', isStreamingRef.current);
                
                if (!isStreamingRef.current || !mediaRecorderRef.current) {
                    console.log('Stopping chunk interval - stream ended');
                    return;
                }

                try {
                    // Stop current recording to get blob
                    const currentRecorder = mediaRecorderRef.current;
                    
                    currentRecorder.stopRecording(() => {
                        const blob = currentRecorder.getBlob();
                        console.log('Generated chunk blob size:', blob.size);
                        
                        if (blob.size > 0 && isStreamingRef.current) {
                            sendVideoChunk(blob);
                        }
                        
                        // Start a new recording session if still streaming
                        if (isStreamingRef.current) {
                            console.log('Starting new recording session...');
                            
                            const newRecorder = new RecordRTC(stream, {
                                type: 'video',
                                mimeType: 'video/webm;codecs=vp8',
                                videoBitsPerSecond: 1000000,
                                frameInterval: 33,
                                canvas: { 
                                    width: 1280, 
                                    height: 720 
                                },
                                disableLogs: false
                            });
                            
                            mediaRecorderRef.current = newRecorder;
                            newRecorder.startRecording();
                        }
                    });
                    
                } catch (error) {
                    console.error('Error in chunk processing:', error);
                    setConnectionStatus('error');
                }
            };

            // Set up interval to send chunks every 2 seconds
            chunkIntervalRef.current = setInterval(sendChunks, 2000);
            // console.log('Chunk interval started');

        } catch (error) {
            console.error('WebRTC streaming error:', error);
            alert('Failed to start WebRTC streaming: ' + error.message);
            setConnectionStatus('error');
            throw error;
        }
    };

    const stopStreaming = async () => {
        try {
            console.log('Stopping stream...');
            
            // Update refs first to stop interval
            isStreamingRef.current = false;
            setIsStreaming(false);
            setConnectionStatus('disconnecting');
            
            // Clear interval first
            if (chunkIntervalRef.current) {
                clearInterval(chunkIntervalRef.current);
                chunkIntervalRef.current = null;
                console.log('Chunk interval cleared');
            }

            // Stop recording and send final chunk
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stopRecording(() => {
                    const finalBlob = mediaRecorderRef.current.getBlob();
                    console.log('Final chunk size:', finalBlob.size);
                    
                    if (finalBlob.size > 0) {
                        sendVideoChunk(finalBlob);
                    }
                    
                    mediaRecorderRef.current = null;
                });
            }

            // Notify server that stream ended
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/streams/${streamData.streamId}/end`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setConnectionStatus('disconnected');
            console.log('Streaming stopped successfully');

        } catch (error) {
            console.error('Stop streaming error:', error);
            setConnectionStatus('error');
        }
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            console.log('Component unmounting, cleaning up...');
            isStreamingRef.current = false;
            
            if (chunkIntervalRef.current) {
                clearInterval(chunkIntervalRef.current);
            }
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stopRecording();
            }
        };
    }, []);

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'text-green-600';
            case 'connecting': return 'text-yellow-600';
            case 'sending': return 'text-blue-600';
            case 'error': return 'text-red-600';
            case 'disconnecting': return 'text-orange-600';
            default: return 'text-gray-500';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return '🟢 Connected';
            case 'connecting': return '🟡 Connecting...';
            case 'sending': return '🔵 Sending...';
            case 'error': return '🔴 Connection Error';
            case 'disconnecting': return '🟠 Disconnecting...';
            default: return '⚫ Disconnected';
        }
    };

    return (
        <MainLayout><div className="max-w-6xl mx-auto p-6">
            {!streamData ? (
                <div className="bg-white shadow-lg rounded-xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Create Live Stream</h2>
                    <form onSubmit={handleCreateStream} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stream Title</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
                            <h2 className="text-xl font-semibold text-gray-800">{streamData.title}</h2>
                            <p className={`text-sm font-medium ${isStreaming ? 'text-red-600' : 'text-gray-500'}`}>
                                {isStreaming ? '🔴 LIVE' : '⚫ Not Streaming'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-medium ${getStatusColor()}`}>
                                {getStatusText()}
                            </p>
                            {isStreaming && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Sending video chunks every 2s
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

                    {/* Debug Information */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 mb-2">Debug Information</h4>
                        <div className="text-sm text-yellow-700 space-y-1">
                            <p>State: {isStreaming ? 'Streaming' : 'Not Streaming'}</p>
                            <p>Ref: {isStreamingRef.current ? 'Streaming' : 'Not Streaming'}</p>
                            <p>Connection: {connectionStatus}</p>
                            <p>Recorder: {mediaRecorderRef.current ? 'Active' : 'Inactive'}</p>
                            <p>Interval: {chunkIntervalRef.current ? 'Running' : 'Stopped'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div></MainLayout>
    );
};

export default LiveStreamCamera;