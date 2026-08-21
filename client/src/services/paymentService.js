import api from './api';

/**
 * Payment Service
 * All payment-related API calls.
 */

export const createOrder = (data) =>
  api.post('/api/payment/create-order', data);

export const verifyPayment = (data) =>
  api.post('/api/payment/verify', data);

export const getEventPaymentStats = (eventId) =>
  api.get(`/api/payment/event/${eventId}/stats`);

export const getPaymentStats = getEventPaymentStats;

export const reviewPayment = (registrationId, data) =>
  api.put(`/api/payment/${registrationId}/review`, data);

export const updatePaymentDetails = (registrationId, data) =>
  api.put(`/api/payment/${registrationId}/update-details`, data);
