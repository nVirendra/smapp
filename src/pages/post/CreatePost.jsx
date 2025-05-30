import React, { useState, useRef } from 'react';
import { FiCamera, FiMapPin, FiLock, FiGlobe } from 'react-icons/fi';
import { createPost } from '../../services/post.service';
import { toast } from 'react-toastify';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!content && !mediaFile) {
      toast.error('Please write something or add media.');
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('is_private', String(isPrivate));
    if (mediaFile) {
      formData.append('file', mediaFile);
    }

    try {
      setIsLoading(true);
      const { data: newPost } = await createPost(formData);

      // Notify Feed
      onPostCreated(newPost);

      // Reset form
      setContent('');
      setMediaFile(null);
      setPreviewUrl(null);
      setIsPrivate(false);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Post creation failed:', error);
      toast.error('Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 transition-all hover:shadow-2xl border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-4 mb-4">
        <img
          className="w-12 h-12 rounded-full border-2 border-purple-500"
          alt="User"
        />
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-sm p-2 resize-none min-h-[80px] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {previewUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
          {mediaFile?.type.startsWith('video') ? (
            <video controls className="w-full max-h-96">
              <source src={previewUrl} type={mediaFile.type} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full object-cover max-h-96"
            />
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-purple-50 dark:bg-gray-700 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-gray-600 transition"
          >
            <FiCamera className="w-5 h-5" />
            Photo/Video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={handleMediaChange}
          />

          <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-600 transition">
            <FiMapPin className="w-5 h-5" />
            Location
          </button>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
              className="accent-purple-600 w-4 h-4"
            />
            {isPrivate ? (
              <>
                <FiLock className="w-4 h-4" />
                <span>Private</span>
              </>
            ) : (
              <>
                <FiGlobe className="w-4 h-4" />
                <span>Public</span>
              </>
            )}
          </label>

          <button
            onClick={handlePost}
            disabled={isLoading}
            className={`${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            } bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white text-sm font-medium px-6 py-2 rounded-lg shadow hover:brightness-110 transition-all`}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
