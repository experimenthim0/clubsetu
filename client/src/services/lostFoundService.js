import api from './api';

/**
 * Lost & Found Service
 * Public-facing lost-and-found API calls.
 */

export const getLostFoundItems = () =>
  api.get('/api/lost-found');

export const getMyPosts = () =>
  api.get('/api/lost-found/my-posts');

export const createLostFoundItem = (formData) =>
  api.post('/api/lost-found', formData);

export const reuniteItem = (id) =>
  api.patch(`/api/lost-found/${id}/reunite`);

export const claimItem = (id) =>
  api.post(`/api/lost-found/${id}/claim`);

export const reportItem = (id, data) =>
  api.post(`/api/lost-found/${id}/report`, data);

export const uploadLostFoundImage = (formData) =>
  api.post('/api/lost-found/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
