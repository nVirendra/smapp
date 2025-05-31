import React, { useState } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';

const CreateStream = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const startStream = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/streams/${streamData.streamId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Stream started! You can now broadcast using the RTMP URL.');
    } catch (error) {
      console.error('Start stream error:', error);
      alert('Failed to start stream');
    }
  };

  return (
    <MainLayout>
      <div className="col-span-12 md:col-span-10 lg:col-span-8 xl:col-span-6 mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            🎥 Create Live Stream
          </h2>

          {!streamData ? (
            <form onSubmit={handleCreateStream} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stream Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Stream'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-green-600 font-bold text-xl">
                ✅ Stream Created Successfully!
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md space-y-2 text-gray-700 dark:text-gray-300">
                <p><strong>Title:</strong> {streamData.title}</p>
                <p><strong>Stream Key:</strong> {streamData.streamKey}</p>
                <p><strong>RTMP URL:</strong> {streamData.rtmpUrl}</p>
                <p><strong>Playback URL:</strong> {streamData.playbackUrl}</p>
              </div>

              <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-md text-sm">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-white">
                  How to Stream:
                </h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open OBS or any RTMP-compatible software</li>
                  <li>Server URL: <code className="bg-white dark:bg-gray-800 border px-2 py-0.5 rounded">{streamData.rtmpUrl}</code></li>
                  <li>Stream Key: <code className="bg-white dark:bg-gray-800 border px-2 py-0.5 rounded">{streamData.streamKey}</code></li>
                  <li>Click "Start Stream" below</li>
                  <li>Begin broadcasting from your streaming software</li>
                </ol>
              </div>

              <button
                onClick={startStream}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition"
              >
                🚀 Start Stream
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateStream;
