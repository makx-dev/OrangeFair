import apiClient from './axios';

// Authentication & Profile
export const registerUser = (payload) => apiClient.post('/auth/register', payload);
export const loginUser = (payload) => apiClient.post('/auth/login', payload);
export const googleAuth = (payload) => apiClient.post('/auth/google', payload);
export const getMe = () => apiClient.get('/auth/me');
export const updateProfile = (payload) => apiClient.patch('/auth/profile', payload);
export const changePassword = (payload) => apiClient.post('/auth/change-password', payload);

// Plate details
export const getPlate = (plateNumber) => apiClient.get(`/plates/${encodeURIComponent(plateNumber)}`);

// Rides
export const createRide = (payload) => apiClient.post('/rides', payload);
export const getMyRides = () => apiClient.get('/rides/my');
export const splitFare = (payload) => apiClient.post('/rides/split', payload);

// Reports
export const createReport = (payload) => apiClient.post('/reports', payload);
export const getMyReports = (params) => apiClient.get('/reports/my', { params });
export const getReportDetail = (reportId) => apiClient.get(`/reports/${reportId}`);
export const getReportStatus = (reportId) => apiClient.get(`/reports/${reportId}/status`);

// Comments CRUD
export const createComment = (payload) => apiClient.post('/comments', payload);
export const getMyComments = () => apiClient.get('/comments/my');
export const getPlateComments = (plateNumber) => apiClient.get(`/comments/plate/${encodeURIComponent(plateNumber)}`);
export const updateComment = (id, payload) => apiClient.patch(`/comments/${id}`, payload);
export const deleteComment = (id) => apiClient.delete(`/comments/${id}`);
export const reportComment = (id) => apiClient.post(`/comments/${id}/report`);
export const replyToComment = (id, payload) => apiClient.patch(`/comments/${id}/reply`, payload);

// RTO Escalation System
export const checkRtoEligibility = (reportId) => apiClient.get(`/rto/eligibility/${reportId}`);
export const prepareRtoComplaint = (reportId) => apiClient.post(`/rto/prepare/${reportId}`);
export const getMyRtoEscalations = () => apiClient.get('/rto/escalations');
export const getRtoEscalationById = (id) => apiClient.get(`/rto/escalations/${id}`);
export const markRtoSubmitted = (id, payload) => apiClient.patch(`/rto/escalations/${id}/submit`, payload);

// RouteWatch & Leaderboard
export const getRouteWatch = () => apiClient.get('/routewatch');
export const getLeaderboard = () => apiClient.get('/leaderboard');

