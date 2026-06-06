export interface Comment {
    id: number;
    author_name: string;
    content: string;
    created_at: string;
    news_id: number;
    likes: number;
    dislikes: number;
    user_reaction?: 'like' | 'dislike' | null;
}

export interface CreateCommentDto {
    author_name: string;
    content: string;
    news_id: number;
}