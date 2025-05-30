import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  getUserProfile,
  followUser,
  unfollowUser,
  getUserPosts,
} from '../../services/user.service';
import useAuth from '../../hooks/useAuth';
import ProfileHeader from '../../components/profile/ProfileHeader';
import UserPosts from '../../components/profile/UserPosts';
import MainLayout from '../../layouts/MainLayout';
import { likePost } from '../../services/post.service';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (userId) {
      getUserProfile(userId).then((res) => setProfile(res.data));
      getUserPosts(userId).then((res) => setPosts(res.data));
    }
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;

    if (profile.isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }

    setProfile((prev) =>
      prev ? { ...prev, isFollowing: !prev.isFollowing } : null
    );
  };

  if (!profile) return <div>Loading...</div>;

  const toggleLike = async (postId) => {
    try {
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: post.likes.includes(user.id)
                  ? post.likes.filter((id) => id !== user.id)
                  : [...post.likes, user.id],
                liked: !post.likes.includes(user.id),
              }
            : post
        )
      );

      await likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);

      // Optional: Revert logic (can be removed if server syncs later)
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: post.likes.includes(user.id)
                  ? post.likes.filter((id) => id !== user.id)
                  : [...post.likes, user.id],
                liked: !post.likes.includes(user.id),
              }
            : post
        )
      );
    }
  };

  return (
    <MainLayout>
      <section className="lg:col-span-8 lg:col-start-3 space-y-6">
        <ProfileHeader
          profile={profile}
          onFollowToggle={handleFollow}
          isMe={user._id === userId}
        />
        <UserPosts posts={posts} toggleLike={toggleLike} />
      </section>
    </MainLayout>
  );
};

export default UserProfilePage;
