import {getNewsByTag} from '../../services/tagsService';
import React, { useEffect, useState } from 'react';
import NewsList from './NewsList';
import { useParams } from 'react-router-dom';

const NewsByTag: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    useEffect(() => {
        fetchNewsByTag();
    }, [id]);

    const fetchNewsByTag = async () => {
        try {
            setLoading(true);
            if (!id) {
                setError('Nevažeći ID taga');
                return;
            }

            const data = await getNewsByTag(Number(id));
            setNews(data.data ?? []);
            setTotalPages(data.totalPages || 1);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri ucitavanju vesti po tagu');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };


 return (
        <div className="homepage-container">
            <div className="homepage-header">
                <h1>Vesti</h1>
            </div>
            
            
            <div className="news-section">
                
                <NewsList 
                    news={news}
                    loading={loading}
                    error={error}
                />

                {!loading && !error && totalPages > 1 && (
                    <div className="pagination-bar" aria-label="Paginacija vesti">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Prethodna
                        </button>

                        <div className="pagination-pages">
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                <button
                                    key={page}
                                    className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                    aria-current={page === currentPage ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Sledeca
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NewsByTag;