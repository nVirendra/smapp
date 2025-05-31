import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import RecordRTC from 'recordrtc';
import axios from 'axios';

const LiveStreamCamera = () => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunkIntervalRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamData, setStreamData] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isCreatingStream, setIsCreatingStream] = useState(false);
    const [loading, setLoading] = useState(false);

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
                return;
            }
            
            setIsStreaming(true);
            console.log('before start streaming',isStreaming);
            await startWebRTCStreaming(stream);
        } catch (error) {
            console.error('Start streaming error:', error);
            alert('Failed to start streaming');
        }
    };

    const startWebRTCStreaming = async (stream) => {
        try {
            console.log('Starting WebRTC streaming...');
            
            const recorder = new RecordRTC(stream, {
                type: 'video',
                mimeType: 'video/webm;codecs=vp8',
                videoBitsPerSecond: 1000000,
                frameInterval: 33,
                timeSlice: 2000, // Important: This enables ondataavailable events
                canvas: { width: 1280, height: 720 }
            });

            mediaRecorderRef.current = recorder;
            
            // Set up data available handler
            recorder.ondataavailable = (blob) => {
                console.log('Data available, blob size:', blob.size);
                if (blob.size > 0 && isStreaming) {
                    sendVideoChunk(blob);
                }
            };

            // Start recording
            recorder.startRecording();
            console.log('Recording started');

            // Alternative method using intervals if ondataavailable doesn't work
            const sendChunksToServer = () => {
                console.log('Checking for chunks to send...',mediaRecorderRef.current,isStreaming);
                if (mediaRecorderRef.current && isStreaming) {
                    try {
                        // Stop and get blob
                        recorder.stopRecording(() => {
                            const blob = recorder.getBlob();
                            console.log('Got blob with size:', blob.size);
                            
                            if (blob.size > 0) {
                                sendVideoChunk(blob);
                            }
                            
                            // Restart recording if still streaming
                            if (isStreaming && mediaRecorderRef.current) {
                                const newRecorder = new RecordRTC(stream, {
                                    type: 'video',
                                    mimeType: 'video/webm;codecs=vp8',
                                    videoBitsPerSecond: 1000000,
                                    frameInterval: 33,
                                    canvas: { width: 1280, height: 720 }
                                });
                                
                                mediaRecorderRef.current = newRecorder;
                                newRecorder.startRecording();
                            }
                        });
                    } catch (error) {
                        console.error('Error in chunk processing:', error);
                    }
                }
            };

            // Set up interval for sending chunks
            chunkIntervalRef.current = setInterval(sendChunksToServer, 2000);

        } catch (error) {
            console.error('WebRTC streaming error:', error);
            alert('Failed to start WebRTC streaming: ' + error.message);
        }
    };

    const sendVideoChunk = async (blob) => {
        try {
            console.log('Sending video chunk of size:', blob.size);
            
            const formData = new FormData();
            formData.append('videoChunk', blob, 'chunk.webm');
            formData.append('streamKey', streamData.streamKey);
            formData.append('timestamp', Date.now().toString());

            const response = await axios.post('http://localhost:5000/api/streams/chunk', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('Chunk sent successfully:', response.status);

        } catch (error) {
            console.error('Send chunk error:', error.response?.data || error.message);
            
            // Don't stop streaming for temporary network errors
            if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
                console.log('Temporary error, continuing stream...');
            }
        }
    };

    const stopStreaming = async () => {
        try {
            setIsStreaming(false);
            
            // Clear interval
            if (chunkIntervalRef.current) {
                clearInterval(chunkIntervalRef.current);
                chunkIntervalRef.current = null;
            }

            // Stop recording
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stopRecording(() => {
                    // Send final chunk if available
                    const finalBlob = mediaRecorderRef.current.getBlob();
                    if (finalBlob.size > 0) {
                        sendVideoChunk(finalBlob);
                    }
                });
                mediaRecorderRef.current = null;
            }

            // Notify server
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/streams/${streamData.streamId}/end`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            console.log('Streaming stopped successfully');

        } catch (error) {
            console.error('Stop streaming error:', error);
        }
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (chunkIntervalRef.current) {
                clearInterval(chunkIntervalRef.current);
            }
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stopRecording();
            }
        };
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-6">
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                rows={4}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Stream'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">{streamData.title}</h2>
                        <p className={`text-sm font-medium ${isStreaming ? 'text-red-600' : 'text-gray-500'}`}>
                            {isStreaming ? '🔴 LIVE' : '⚫ Not Streaming'}
                        </p>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
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
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                🎥 Start Live Stream
                            </button>
                        ) : (
                            <button
                                onClick={stopStreaming}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                ⏹️ Stop Stream
                            </button>
                        )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium text-gray-800">Stream URL:</span> {streamData.playbackUrl}</p>
                        <p><span className="font-medium text-gray-800">Stream Key:</span> {streamData.streamKey}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveStreamCamera;