
export interface TagDb {
    id: number;
    name: string;
    created_at: Date;
}

export interface NewsTagDb {
    news_id: number;
    tag_id: number;
}
