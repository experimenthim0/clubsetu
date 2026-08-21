import api from './api';

/**
 * Club Service
 * All club-related API calls.
 */

export const getClubs = () =>
  api.get('/api/clubs');

export const getClubById = (id) =>
  api.get(`/api/clubs/${id}`);

export const getClubBySlugOrId = (identifier) =>
  api.get(`/api/clubs/${identifier}`);

export const updateClub = (id, data) =>
  api.put(`/api/clubs/${id}`, data);

export const deleteClub = (id) =>
  api.delete(`/api/clubs/${id}`);

// ── Members ────────────────────────────────────────────────────────────────
export const getClubMembers = (clubId) =>
  api.get(`/api/club-members/${clubId}/members`);

export const addClubMember = (clubId, data) =>
  api.post(`/api/club-members/${clubId}/members`, data);

export const updateClubMember = (arg1, arg2, arg3) => {
  if (arg3 !== undefined) {
    return api.put(`/api/club-members/${arg1}/members/${arg2}`, arg3);
  }
  return api.put(`/api/club-members/members/${arg1}`, arg2);
};

export const removeClubMember = (arg1, arg2) => {
  if (arg2 !== undefined) {
    return api.delete(`/api/club-members/${arg1}/members/${arg2}`);
  }
  return api.delete(`/api/club-members/members/${arg1}`);
};

// ── Leaderboard ────────────────────────────────────────────────────────────
export const getClubLeaderboard = () =>
  api.get('/api/clubs/leaderboard');
