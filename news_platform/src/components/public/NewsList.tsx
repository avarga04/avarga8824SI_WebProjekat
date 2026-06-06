import React from 'react';
import NewsCard from './NewsCard';
import type { NewsCard as NewsCardType } from '../../types/newsTypes';

interface NewsListProps {
    news: NewsCardType[];
    loading: boolean;
    error: string | null;
}

const NewsList: React.FC<NewsListProps> = ({ news, loading, error }) => {
    if (loading) {
        return (
            <div className="news-grid-loading">
                <div className="loader"></div>
                <p>Ucitavanje vesti...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="news-grid-error">
                <p>{error}</p>
            </div>
        );
    }

    if (news.length === 0) {
        return (
            <div className="news-grid-empty">
                <p>Nema vesti</p>
            </div>
        );
    }

    return (
        <div className="news-grid">
            {news.map((item) => (
                <NewsCard key={item.id} news={item} />
            ))}
        </div>
    );
};

export default NewsList;