import React from 'react';
import { Link } from 'react-router-dom';
import type { NewsCard as NewsCardType } from '../../types/newsTypes';

interface NewsCardProps {
    news: NewsCardType;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `pre ${diffMins} minuta `;
        } else if (diffHours < 24) {
            return `pre ${diffHours} sati `;
        } else if (diffDays < 7) {
            return `pre ${diffDays} dana `;
        } else {
            return date.toLocaleDateString('sr-RS', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    return (
        <Link to={`/news/${news.id}`} className="news-card">
            <div className="news-card-content">
                <h3 className="news-card-title">{news.title}</h3>
                <div className="news-card-meta">
                    <span className="news-card-author">
                         {news.author_name + ' - '}
                    </span>
                    <span className="news-card-date">
                         {formatDate(news.published_at)}
                    </span>
                    <span className="news-card-views">
                         Pregledi: {news.views + '  '}
                    </span>
                    <span category-id={news.category_id} className="news-card-category">
                         {"Kategorija: " + news.category_name}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default NewsCard;