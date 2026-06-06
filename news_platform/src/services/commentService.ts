import api from './api';
import type { Comment, CreateCommentDto } from '../types/commentTypes';
import type { PaginatedResponse } from '../types/newsTypes';

export const getCommentsByNews = async (newsId: number, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get(`/comments/news/${newsId}?page=${page}&limit=${limit}`);
    return response.data;
};

export const createComment = async (data: CreateCommentDto): Promise<Comment> => {
    const response = await api.post('/comments', data);
    return response.data;
};

export const likeComment = async (commentId: number): Promise<void> => {
    await api.post(`/comments/${commentId}/like`);
};

export const dislikeComment = async (commentId: number): Promise<void> => {
    await api.post(`/comments/${commentId}/dislike`);
};