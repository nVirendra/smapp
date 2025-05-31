import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Users, Heart, Share2, Flag, Send } from 'lucide-react';

const WatchPage = () => {
  // Stream data (would come from props/API in real app)
  const stream = {
    _id: 'stream123',
    title: 'Epic Gaming Session - Exploring the New World',
    streamer: {
      name: 'GameMaster_Pro',
      avatar: 'https://via.placeholder.com/40x40/4f46e5/ffffff?text=GM',
      followers: 12500,
      isFollowing: false
    },
    category: 'Gaming',
    viewers: 1847,
    isLive: true,
    duration: '2:34:15',
    thumbnail: 'https://via.placeholder.com/800x450/1f2937/ffffff?text=Live+Stream'
  };

  // Component state
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(stream.streamer.isFollowing);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'ViewerOne', message: 'Great stream!', timestamp: '2:30' },
    { id: 2, user: 'GamerGirl22', message: 'Love this game', timestamp: '2:31' },
    { id: 3, user: 'ProPlayer99', message: 'Nice moves!', timestamp: '2:32' },
    { id: 4, user: 'StreamFan', message: 'Been watching for hours', timestamp: '2:33' }
  ]);

  const videoRef = useRef(null);
  const chatRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value));
    setIsMuted(false);
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        user: 'You',
        message: chatMessage.trim(),
        timestamp: '2:34'
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="flex-1 p-4">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <div className="aspect-video relative">
              <img 
                src={stream.thumbnail} 
                alt="Stream" 
                className="w-full h-full object-cover"
              />
              
              {/* Player Controls Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={togglePlay}
                        className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={toggleMute}
                          className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                        >
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <span className="text-sm">{stream.duration}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                        <Settings size={20} />
                      </button>
                      <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                        <Maximize size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Live Indicator */}
              {stream.isLive && (
                <div className="absolute top-4 left-4 bg-red-600 px-2 py-1 rounded text-sm font-semibold">
                  LIVE
                </div>
              )}
              
              {/* Viewer Count */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-2 py-1 rounded flex items-center space-x-1">
                <Users size={16} />
                <span className="text-sm">{stream.viewers.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Stream Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h1 className="text-2xl font-bold mb-2">{stream.title}</h1>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src={stream.streamer.avatar} 
                  alt={stream.streamer.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{stream.streamer.name}</h3>
                  <p className="text-gray-400 text-sm">{stream.streamer.followers.toLocaleString()} followers</p>
                </div>
                <button
                  onClick={toggleFollow}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    isFollowing 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                  <Heart size={20} />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                  <Share2 size={20} />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                  <Flag size={20} />
                </button>
              </div>
            </div>
            
            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-400">
              <span className="bg-gray-700 px-2 py-1 rounded">{stream.category}</span>
              <span>Started {stream.duration} ago</span>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-80 p-4">
          <div className="bg-gray-800 rounded-lg h-96 lg:h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">Stream Chat</h3>
              <p className="text-sm text-gray-400">{stream.viewers.toLocaleString()} viewers</p>
            </div>
            
            {/* Chat Messages */}
            <div 
              ref={chatRef}
              className="flex-1 p-4 overflow-y-auto space-y-2"
            >
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="text-purple-400 font-semibold">{msg.user}</span>
                  <span className="text-gray-400 text-xs ml-2">{msg.timestamp}</span>
                  <p className="text-gray-200 mt-1">{msg.message}</p>
                </div>
              ))}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
                  placeholder="Say something..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;