import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FilterBar from './FiltersBar';
import NewsList from './NewsList';
import SearchForSpecificNews from './SearchForSpecificNews';
import type { NewsCard } from '../../types/newsTypes';
import { useAuth } from '../../contexts/AuthContext';
import { 
    getLatestNews, 
    getMostReadNews, 
    getNewsByCategory,
    getNews
} from '../../services/newsService';
    
const HomePage: React.FC = () => {
    const { isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [news, setNews] = useState<NewsCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('latest');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const pageSize = 10;

    // ovde smo ucitali vesti na osnovu filtera, kategorije, paginacije i pretrage - msm sve sto je u zavisnosti od ovih stvari
    useEffect(() => {
        loadNews();
    }, [activeFilter, selectedCategoryId, currentPage, searchTerm]);

    const loadNews = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let data: NewsCard[] = [];
            let nextTotalPages = 1;

            if (isAuthenticated && searchTerm.trim()) {
                const response = await getNews(currentPage, pageSize, searchTerm);
                data = response.data;
                nextTotalPages = response.totalPages;

                setNews(data);
                setTotalPages(nextTotalPages);
                return;
            }
            
            switch (activeFilter) {
                case 'latest':
                    {
                        const response = await getLatestNews(currentPage, pageSize);
                        data = response.data;
                        nextTotalPages = response.totalPages;
                    }
                    break;
                case 'most-read':
                    {
                        const response = await getMostReadNews(currentPage, pageSize);
                        data = response.data;
                        nextTotalPages = response.totalPages;
                    }
                    break;
                case 'category':
                    if (selectedCategoryId) {
                        const response = await getNewsByCategory(selectedCategoryId, currentPage, pageSize);
                        data = response.data;
                        nextTotalPages = response.totalPages;
                    } else {
                        const response = await getLatestNews(currentPage, pageSize);
                        data = response.data;
                        nextTotalPages = response.totalPages;
                    }
                    break;
                default:
                    {
                        const response = await getLatestNews(currentPage, pageSize);
                        data = response.data;
                        nextTotalPages = response.totalPages;
                    }
            }
            
            setNews(data);
            setTotalPages(nextTotalPages);
        } catch (err: any) {
            console.error('Greska pri ucitavanju vesti:', err);
            setError(err.response?.data?.error || 'Greska pri ucitavanju vesti');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType: string, categoryId?: number) => {
        setActiveFilter(filterType);
        setCurrentPage(1);
        
        if (filterType === 'category' && categoryId) {
            setSelectedCategoryId(categoryId);
        } else if (filterType === 'category' && !categoryId) {
            setSelectedCategoryId(null);
            setActiveFilter('latest'); 
        } else {
            setSelectedCategoryId(null);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setCurrentPage(1);
        setSearchTerm(searchInput.trim());
    };

    const handleSearchClear = () => {
        setSearchInput('');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="homepage-container">
            <div className="homepage-header">
                <div className="homepage-header-content">
                    <div>
                        <h1>Vesti</h1>
                        <p>Budite informisani sa najnovijim vestima</p>
                    </div>

                    <div className="homepage-actions">
                        {isAuthenticated && (
                            <Link className="btn-primary homepage-action-link" to="/cms/news/new">
                                Dodaj pricu
                            </Link>
                        )}

                        {!isAuthenticated && (
                            <Link className="btn-primary homepage-action-link" to="/login">
                                Prijava
                            </Link>
                        )}

                        {isAuthenticated && isAdmin && (
                            <Link className="btn-primary homepage-action-link" to="/cms/categories">
                                Upravljanje kategorijama
                            </Link>
                        )}
                        {isAuthenticated && isAdmin && (
                            <Link className="btn-primary homepage-action-link" to="/cms/users">
                                Upravljanje korisnicima
                            </Link>
                        )}

                        {isAuthenticated && (
                            <button className="btn-primary homepage-action-button" type="button" onClick={handleLogout}>
                                Odjava
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isAuthenticated && (
                <div className="homepage-search-wrap">
                    <SearchForSpecificNews
                        value={searchInput}
                        onChange={setSearchInput}
                        onSubmit={handleSearchSubmit}
                        onClear={handleSearchClear}
                        loading={loading}
                    />
                </div>
            )}
            
            <FilterBar 
                onFilterChange={handleFilterChange}
                activeFilter={activeFilter}
                selectedCategoryId={selectedCategoryId}
            />
            
            <div className="news-section">
                <div className="section-title">
                    {isAuthenticated && searchTerm.trim() ? (
                        <h2> Rezultati pretrage</h2>
                    ) : activeFilter === 'latest' ? (
                        <h2> Najnovije vesti</h2>
                    ) : activeFilter === 'most-read' ? (
                        <h2> Najcitanije vesti</h2>
                    ) : activeFilter === 'category' && selectedCategoryId ? (
                        <h2> Kategorija</h2>
                    ) : null}
                </div>
                
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
};

export default HomePage;