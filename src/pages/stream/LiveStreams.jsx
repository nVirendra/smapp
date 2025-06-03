import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';
import { FiPlay } from 'react-icons/fi';
import { Link } from 'react-router-dom';


const LiveStreams = () => {
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  const fetchLiveStreams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/streams/live', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('what is fetching',response);
      setLiveStreams(response.data);
    } catch (error) {
      console.error('Fetch streams error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <MainLayout >
        <div className="text-center text-lg font-medium py-10 text-gray-600 animate-pulse">
          Loading live streams...
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">🎥 Live Streams</h2>

        {liveStreams.length === 0 ? (
          <p className="text-gray-500 text-center">No live streams available</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {liveStreams.map((stream) => (
              <div
                key={stream._id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5 flex flex-col justify-between"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* <img
                    src={stream.user.profilePicture || '/default-avatar.png'}
                    alt={stream.user.username}
                    className="w-12 h-12 rounded-full border object-cover"
                  /> */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{stream.title}</h3>
                    <p className="text-sm text-gray-500">by {stream.user.username}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{stream.description}</p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full">
                    🔴 LIVE
                  </span>
                  <Link
                    to={`/watch/${stream.streamKey}`}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <FiPlay className="text-white" />
                    Watch
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
        )}
      </div>
    </MainLayout>
  );
};

export default LiveStreams;
