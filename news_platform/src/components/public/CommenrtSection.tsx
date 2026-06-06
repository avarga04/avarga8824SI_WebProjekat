import React, { useState } from 'react';
import type { Comment } from '../../types/commentTypes';
import { likeComment, dislikeComment, createComment } from '../../services/commentService';

interface CommentSectionProps {
    comments: Comment[];
    newsId: number;
    onCommentAdded: (newComment: Comment) => void;
    refreshComments: (page?: number) => Promise<void>;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, newsId, onCommentAdded, refreshComments, currentPage = 1, totalPages = 1, onPageChange }) => {
    const [authorName, setAuthorName] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLike = async (commentId: number) => {
        try {
            await likeComment(commentId);
            await refreshComments();
        } catch (error) {
            console.error('Greska pri lajkovanju:', error);
        }
    };

    const handleDislike = async (commentId: number) => {
        try {
            await dislikeComment(commentId);
            await refreshComments();
        } catch (error) {
            console.error('Greska pri dislajkovanju:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!authorName.trim()) {
            setError('Ime je obavezno');
            setLoading(false);
            return;
        }

        if (!content.trim()) {
            setError('Komentar je obavezan');
            setLoading(false);
            return;
        }

        try {
            const newComment = await createComment({
                author_name: authorName.trim(),
                content: content.trim(),
                news_id: newsId
            });
            
            setAuthorName('');
            setContent('');
            onCommentAdded(newComment);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri dodavanju komentara');
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="comment-section">
            <h3>Komentari ({comments.length})</h3>
            <div className="comment-form">
                <h4>Dodaj komentar</h4>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Vaše ime:</label>
                        <input
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            required
                            disabled={loading} 
                        />
                    </div>
                    <div className="form-group">
                        <label>Komentar:</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            required
                            disabled={loading}
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Slanje...' : 'Posalji komentar'}
                    </button>
                </form>
            </div>
            
            {/* lista komentara */}
            <div className="comments-list">
                {comments.length === 0 ? (
                    <p className="no-comments">Jos nema komentara</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-card">
                            <div className="comment-header">
                                <strong className="comment-author">{comment.author_name + " "}</strong>
                                <span className="comment-date">{formatDate(comment.created_at)}</span>
                            </div>
                            <div className="comment-content">{comment.content}</div>
                            <div className="comment-actions">
                                <button 
                                    className="like-btn" 
                                    onClick={() => handleLike(comment.id)}
                                >
                                    👍 {comment.likes || 0}
                                </button>
                                <button 
                                    className="dislike-btn" 
                                    onClick={() => handleDislike(comment.id)}
                                >
                                    👎 {comment.dislikes || 0}
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {totalPages > 1 && (
                    <div className="comment-pagination">
                        <button disabled={currentPage === 1} onClick={() => onPageChange && onPageChange(currentPage - 1)}>Prethodna</button>
                        <div className="comment-pages">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    className={p === currentPage ? 'active' : ''}
                                    onClick={() => onPageChange && onPageChange(p)}
                                >{p}</button>
                            ))}
                        </div>
                        <button disabled={currentPage === totalPages} onClick={() => onPageChange && onPageChange(currentPage + 1)}>Sledeca</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;