import apiClient from './axios';

export const registerUser = (payload) => apiClient.post('/auth/register', payload);
export const loginUser = (payload) => apiClient.post('/auth/login', payload);
export const googleAuth = (payload) => apiClient.post('/auth/google', payload);
export const devLogin = () => apiClient.post('/auth/dev-login');
export const getPlate = (plateNumber) => apiClient.get(`/plates/${encodeURIComponent(plateNumber)}`);
export const createRide = (payload) => apiClient.post('/rides', payload);
export const splitFare = (payload) => apiClient.post('/rides/split', payload);
export const createReport = (payload) => apiClient.post('/reports', payload);
export const getReportStatus = (reportId) => apiClient.get(`/reports/${reportId}/status`);
export const createComment = (payload) => apiClient.post('/comments', payload);
export const getRouteWatch = () => apiClient.get('/routewatch');
export const getLeaderboard = () => apiClient.get('/leaderboard');
