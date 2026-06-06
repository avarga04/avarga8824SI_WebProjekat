import api from './api';
import type { Category, CreateCategoryDto } from '../types/categoryTypes';

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
};

export const createCategory = async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data;
};

export const updateCategory = async (id: number, data: CreateCategoryDto): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
};