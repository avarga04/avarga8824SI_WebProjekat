
export interface CommentDb {
    id: number;
    author_name: string;
    content: string;
    created_at: Date;
    news_id: number;
    likes: number;
    dislikes: number;
}

export interface CreateCommentRequest {
    author_name: string;
    content: string;
    news_id: number;
}

export interface CommentReactionDb {
    id: number;
    comment_id: number;
    session_id: string;
    reaction_type: 'like' | 'dislike';
    created_at: Date;
}
