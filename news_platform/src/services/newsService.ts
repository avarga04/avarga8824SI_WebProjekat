import api from './api';
import type { News, CreateNewsDto, PaginatedResponse } from '../types/newsTypes';

export const getNews = async (page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<News>> => {
    const searchQuery = search.trim();
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (searchQuery) {
        queryParams.set('search', searchQuery);
    }

    const response = await api.get(`/news?${queryParams.toString()}`);
    return response.data;
};

export const getLatestNews = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<News>> => {
    const response = await api.get(`/news/latest?page=${page}&limit=${limit}`);
    return response.data;
};

export const getMostReadNews = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<News>> => {
    const response = await api.get(`/news/most-read?page=${page}&limit=${limit}`);
    return response.data;
};

export const getNewsByCategory = async (categoryId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponse<News>> => {
    const response = await api.get(`/news/category/${categoryId}?page=${page}&limit=${limit}`);
    return response.data;
}

export const getNewsById = async (id: number): Promise<News> => {
    const response = await api.get(`/news/${id}`);
    return response.data;
};

export const getRelatedNews = async (id: number, limit: number = 3): Promise<News[]> => {
    const response = await api.get(`/news/${id}/related?limit=${limit}`);
    return response.data;
};

export const createNews = async (data: CreateNewsDto): Promise<News> => {
    const response = await api.post('/news', data);
    return response.data;
};

export const updateNews = async (id: number, data: CreateNewsDto): Promise<News> => {
    const response = await api.put(`/news/${id}`, data);
    return response.data;
};

export const deleteNews = async (id: number): Promise<void> => {
    await api.delete(`/news/${id}`);
};

export const registerView = async (id: number): Promise<void> => {
    await api.post(`/news/${id}/view`);
};

export const likeNews = async (id: number): Promise<void> => {
    await api.post(`/news/${id}/like`);
};

export const dislikeNews = async (id: number): Promise<void> => {
    await api.post(`/news/${id}/dislike`);
};