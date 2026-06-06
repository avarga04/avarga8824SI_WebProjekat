import api from './api';
import type { LoginCredentials, LoginResponse, User } from '../types/userTypes';

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const logout = async (): Promise<void> => {
    await api.post('/auth/logout');
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
};