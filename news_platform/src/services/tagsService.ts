import api from './api';
import type { Tag } from '../types/tagTypes';
import type { PaginatedResponse, News } from '../types/newsTypes';

export interface CreateTagDto {
	name: string;
}

export const getTags = async (): Promise<Tag[]> => {
	const response = await api.get('/tags');
	return response.data;
};

export const getTagById = async (id: number): Promise<Tag> => {
	const response = await api.get(`/tags/${id}`);
	return response.data;
};

export const getNewsByTag = async (tagId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponse<News>> => {
	const response = await api.get(`/tags/${tagId}/news?page=${page}&limit=${limit}`);
	return response.data;
};

export const createTag = async (data: CreateTagDto): Promise<Tag> => {
	const response = await api.post('/tags', data);
	return response.data;
};

export const deleteTag = async (id: number): Promise<void> => {
	await api.delete(`/tags/${id}`);
};
