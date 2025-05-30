import API from './api';

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // or however you're storing it
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getUserProfile = (userId) => API.get(`/users/${userId}`);
export const fetchUsers = (search = '') =>
  API.get(`/users?search=${encodeURIComponent(search)}`);
export const followUser = (userId) => API.post(`/users/${userId}/follow`);
export const unfollowUser = (userId) => API.post(`/users/${userId}/unfollow`);
export const getUserPosts = (userId) => API.get(`/posts/user/${userId}`);
