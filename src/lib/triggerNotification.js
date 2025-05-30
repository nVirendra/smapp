import API from '../services/api';

export const sendNotification = async ({ senderId, receiverId, postId }) => {
  return API.post('/notifications', {
    senderId,
    receiverId,
    postId,
  });
};
