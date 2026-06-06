import api from './api';
import type { User, CreateUserDto, UpdateUserDto } from '../types/userTypes';

export const getAllUsers = async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
};

export const createUser = async (data: CreateUserDto): Promise<User> => {
    const response = await api.post('/auth/users', data);
    return response.data.user || response.data;
};

export const updateUser = async (id: number, data: UpdateUserDto): Promise<User> => {
    const response = await api.put(`/auth/users/${id}`, data);
    return response.data.user || response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/auth/users/${id}`);
};

export default {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
};
