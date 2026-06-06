import type { Tag } from './tagTypes';
import type { Comment } from './commentTypes';

export interface News {
    id: number;
    title: string;
    content: string;
    published_at: string;
    views: number;
    author_id: number;
    author_name?: string;
    category_id: number;
    category_name?: string;
    tags?: Tag[];
    comments?: Comment[];
    like_count?: number;
    dislike_count?: number;
    likes?: number;
    dislikes?: number;
    comment_count?: number;
    user_reaction?: 'like' | 'dislike' | null;
}

export type SortType = 'latest' | 'most-read' | 'category';


export interface NewsCard  {

    id: number;
    title: string;
    published_at: string;
    views: number;
    author_id: number;
    author_name?: string;
    category_id: number;
    category_name?: string;
    tags?: Tag[];
    content_preview?: string;
}

export interface CreateNewsDto {
    title: string;
    content: string;
    category_id: number;
    tags: string[];
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}