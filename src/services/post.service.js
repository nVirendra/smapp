import API from './api';

export const createPost = (data) =>
  API.post('/posts', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const fetchFeed = () => API.get('/posts/feed');
export const likePost = (postId) => API.put(`/posts/like/${postId}`);
export const commentPost = (postId, comment) =>
  API.post(`/posts/comment/${postId}`, { comment });
