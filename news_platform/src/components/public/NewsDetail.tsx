import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { News as NewsType } from '../../types/newsTypes';
import { getNewsById, likeNews, dislikeNews, registerView, getRelatedNews } from '../../services/newsService';
import { getCommentsByNews } from '../../services/commentService';
import CommentSection from './CommenrtSection';
import TagList from './TagList';
import type { Comment } from '../../types/commentTypes';

const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [news, setNews] = useState<NewsType | null>(null);
    const [relatedNews, setRelatedNews] = useState<NewsType[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
    const [commentsPage, setCommentsPage] = useState(1);
    const [commentsTotalPages, setCommentsTotalPages] = useState(1);
    const commentsPageSize = 10;

    const getLikeCount = (item: NewsType) => item.likes ?? item.like_count ?? 0;
    const getDislikeCount = (item: NewsType) => item.dislikes ?? item.dislike_count ?? 0;

    useEffect(() => {
        if (id) {
            loadNews();
            registerViewNews();
             loadComments();
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadComments();
        }
    }, [commentsPage]);

    const loadNews = async () => {
        try {
            setLoading(true);
            const data = await getNewsById(parseInt(id!));
            setNews(data);
            setUserReaction(data.user_reaction || null);
            
            // Ucitamo srodne vesti nakon sto ucitamo glavnu vest, jer nam treba kategorija glavne vesti da bismo nasli rodne
            const related = await getRelatedNews(parseInt(id!));
            setRelatedNews(related);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greška pri učitavanju vesti');
        } finally {
            setLoading(false);
        }
    };

    const registerViewNews = async () => {
        try {
            await registerView(parseInt(id!));
        } catch (error) {
            console.error('Greska pri registrovanju pregleda:', error);
        }
    };

    const loadComments = async () => {
        try {
            const resp = await getCommentsByNews(parseInt(id!), commentsPage, commentsPageSize);
            setComments(resp.data);
            setCommentsTotalPages(resp.totalPages || 1);
        } catch (error) {
            console.error('Greska pri učitavanju komentara:', error);
        }
    };

    const handleLike = async () => {
        if (!news) return;

        try {
            await likeNews(news.id);
            const updated = await getNewsById(news.id);
            setNews(updated);
            setUserReaction(updated.user_reaction || null);

        } catch (error) {
            console.error('Greska pri lajkovanju:', error);
        }
    };

    const handleDislike = async () => {
        if (!news) return;
        
        try {
            await dislikeNews(news.id);
            const updated = await getNewsById(news.id);
            setNews(updated);
            setUserReaction(updated.user_reaction || null);
        } catch (error) {
            console.error('Greska pri dislajkovanju:', error);
        }
    };

    const handleCommentAdded = (newComment: Comment) => {
        setCommentsPage(1);
        setComments((prev) => [newComment, ...prev]);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('sr-RS', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="loading">Ucitavanje vesti...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!news) {
        return <div className="error-message">Vest nije pronadjena</div>;
    }

    return (
        <div className="news-detail-container">
            <article className="news-detail">
                <h1 className="news-title">{news.title}</h1>
                
                <div className="news-meta">
                    <span className="news-author">
                         {news.author_name}
                    </span>
                    <span className="news-date">
                         {formatDate(news.published_at) + ' - '}
                    </span>
                    <span className="news-category">
                         {"Kategorija: " + news.category_name + ",  "}
                    </span>
                    <span className="news-views">
                         {"Pregledi: " + news.views}
                    </span>
                </div>
                
                <div className="news-content">
                    {news.content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
                
                <TagList tags={news.tags || []} />
                
                <div className="reaction-buttons">
                    <button 
                        className={`like-btn ${userReaction === 'like' ? 'active' : ''}`}
                        onClick={handleLike}
                    >
                        👍 {getLikeCount(news)}
                    </button>
                    <button 
                        className={`dislike-btn ${userReaction === 'dislike' ? 'active' : ''}`}
                        onClick={handleDislike}
                    >
                        👎 {getDislikeCount(news)}
                    </button>
                </div>
            </article>
          
            <CommentSection 
                comments={comments}
                newsId={news.id}
                onCommentAdded={handleCommentAdded}
                refreshComments={(page?: number) => { if (page) setCommentsPage(page); return loadComments(); }}
                currentPage={commentsPage}
                totalPages={commentsTotalPages}
                onPageChange={(p: number) => setCommentsPage(p)}
            />

            {relatedNews.length > 0 && (
                <div className="related-news">
                    <h3>Pročitaj jos</h3>
                    <div className="related-news-grid">
                        {relatedNews.map((related) => (
                            <Link to={`/news/${related.id}`} key={related.id} className="related-card">
                                <h4>{related.title}</h4>
                                <p>{related.content?.substring(0, 100)}...</p>
                                <span className="related-date">{formatDate(related.published_at)}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsDetail;