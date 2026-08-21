import api from './api';

/**
 * Certificate Service
 * Certificate design and download API calls.
 */

export const saveCertificateTemplate = (eventId, data) =>
  api.post(`/api/certificates/${eventId}/template`, data);

export const uploadCertificateBackground = (formData) =>
  api.post('/api/certificates/upload-template', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const uploadCertificateTemplate = uploadCertificateBackground;

export const downloadCertificate = (eventId) =>
  api.get(`/api/certificates/${eventId}/download`, {
    responseType: 'blob',
  });
