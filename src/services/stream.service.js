import API from './api';

export const createStreamService = (data) => API.post('/auth/streams', data);
