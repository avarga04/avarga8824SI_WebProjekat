import { CategoryDb } from './categoryTypes';
import { TagDb } from './tagTypes';
import { CommentDb } from './commentTypes';
import { UserResponse } from './userTypes';

export interface NewsDb {
    id: number;
    title: string;
    content: string;
    published_at: Date;
    views: number;
    author_id: number;
    category_id: number;
    created_at: Date;
    updated_at: Date;
    like_count: number;
    dislike_count: number;
}

export interface CreateNewsRequest {
    title: string;
    content: string;
    category_id: number;
    tags: string[];
}

export interface UpdateNewsRequest {
    title?: string;
    content?: string;
    category_id?: number;
    tags?: string[];
}
