const ProfileHeader = ({ profile, onFollowToggle, isMe }) => {
  return (
    <div className="flex items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
      <img className="w-20 h-20 rounded-full" alt="User" />
      <div className="flex-1">
        <h2 className="text-2xl font-bold">{profile.name}</h2>
        <p className="text-gray-500">{profile.bio || 'No bio'}</p>
        <div className="flex gap-4 mt-2">
          <span>{profile.followers.length} Followers</span>
          <span>{profile.following.length} Following</span>
        </div>
      </div>
      {!isMe && (
        <button
          onClick={onFollowToggle}
          className={`px-4 py-2 rounded-full font-medium ${
            profile.isFollowing
              ? 'bg-gray-200 text-gray-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {profile.isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
};

export default ProfileHeader;
