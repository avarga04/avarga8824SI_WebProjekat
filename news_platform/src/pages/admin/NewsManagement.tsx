import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createNews, deleteNews, getNews } from '../../services/newsService';
import { getCategories } from '../../services/categoryService';
import { createTag, getTags } from '../../services/tagsService';
import type { Category } from '../../types/categoryTypes';
import type { News, CreateNewsDto, PaginatedResponse } from '../../types/newsTypes';
import type { Tag } from '../../types/tagTypes';

const pageSize = 10;

const NewsManagement: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const [news, setNews] = useState<News[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [creatingTag, setCreatingTag] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [form, setForm] = useState<CreateNewsDto>({
        title: '',
        content: '',
        category_id: 0,
        tags: [],
    });

    useEffect(() => {
        loadMeta();
    }, []);

    useEffect(() => {
        loadNews();
    }, [currentPage, searchTerm]);

    const visibleNews = useMemo(() => news, [news]);

    const loadMeta = async () => {
        try {
            const [categoryData, tagData] = await Promise.all([getCategories(), getTags()]);
            setCategories(categoryData);
            setTags(tagData);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri ucitavanju podataka za formu');
        }
    };

    const loadNews = async () => {
        try {
            setLoading(true);
            setError(null);
            const response: PaginatedResponse<News> = await getNews(currentPage, pageSize, searchTerm.trim());
            setNews(response.data);
            setTotalPages(response.totalPages);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri ucitavanju vesti');
        } finally {
            setLoading(false);
        }
    };

    const handleTagToggle = (tagName: string) => {
        setForm((current) => {
            const isSelected = current.tags.includes(tagName);
            return {
                ...current,
                tags: isSelected ? current.tags.filter((tag) => tag !== tagName) : [...current.tags, tagName],
            };
        });
    };

    const handleCreateTag = async () => {
        const trimmedName = newTagName.trim();

        if (!trimmedName) {
            return;
        }

        setCreatingTag(true);
        setError(null);
        setSuccess(null);

        try {
            const existingTag = tags.find((tag) => tag.name.toLowerCase() === trimmedName.toLowerCase());

            if (existingTag) {
                setForm((current) => (
                    current.tags.includes(existingTag.name)
                        ? current
                        : { ...current, tags: [...current.tags, existingTag.name] }
                ));
                setNewTagName('');
                setSuccess(`Tag "${existingTag.name}" je vec postojao i dodat je u pricu`);
                return;
            }

            const createdTag = await createTag({ name: trimmedName });

            setTags((current) => (
                current.some((tag) => tag.id === createdTag.id)
                    ? current
                    : [...current, createdTag]
            ));

            setForm((current) => (
                current.tags.includes(createdTag.name)
                    ? current
                    : { ...current, tags: [...current.tags, createdTag.name] }
            ));
            setNewTagName('');
            setSuccess(`Tag "${createdTag.name}" je kreiran i dodat u pricu.`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri kreiranju taga');
        } finally {
            setCreatingTag(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await createNews({
                ...form,
                category_id: Number(form.category_id),
            });
            setForm({
                title: '',
                content: '',
                category_id: categories[0]?.id ?? 0,
                tags: [],
            });
            setSuccess('Vest je uspešno dodata.');
            setCurrentPage(1);
            await loadNews();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri kreiranju vesti');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (newsId: number) => {
        const confirmed = window.confirm('Da li zelite da obrisete ovu pricu?');
        if (!confirmed) {
            return;
        }

        setDeletingId(newsId);
        setError(null);
        setSuccess(null);

        try {
            await deleteNews(newsId);
            setSuccess('Priča je uspešno obrisana.');
            await loadNews();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri brisanju vesti');
        } finally {
            setDeletingId(null);
        }
    };

    const canDelete = (newsItem: News) => isAdmin || newsItem.author_id === user?.id;

    return (
        <div className="admin-page">
            <div className="header">
                <div>
                    <h1>Upravljanje pricama</h1>
                </div>
            </div>

            <div className="admin-panel">
                <form className="admin-form" onSubmit={handleSubmit}>
                    <h2>Nova prica</h2>

                    <div className="form-group">
                        <label htmlFor="news-title">Naslov</label>
                        <input
                            id="news-title"
                            type="text"
                            value={form.title}
                            onChange={(event) => setForm({ ...form, title: event.target.value })}
                            required
                            disabled={saving}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="news-category">Kategorija</label>
                        <select
                            id="news-category"
                            value={form.category_id || ''}
                            onChange={(event) => setForm({ ...form, category_id: Number(event.target.value) })}
                            required
                            disabled={saving || categories.length === 0}
                        >
                            <option value="">Izaberi kategoriju</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="news-content">Kontekst / sadrzaj</label>
                        <textarea
                            id="news-content"
                            rows={8}
                            value={form.content}
                            onChange={(event) => setForm({ ...form, content: event.target.value })}
                            required
                            disabled={saving}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="new-tag">Novi tag</label>
                        <div className="news-management-tag-input">
                            <input
                                id="new-tag"
                                type="text"
                                value={newTagName}
                                onChange={(event) => setNewTagName(event.target.value)}
                                placeholder="Unesi naziv taga"
                                disabled={saving || creatingTag}
                            />
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleCreateTag}
                                disabled={saving || creatingTag || !newTagName.trim()}
                            >
                                {creatingTag ? 'Dodavanje...' : 'Dodaj tag'}
                            </button>
                        </div>
                        <small className="form-help">
                            Ako tag vec postoji, bice samo dodat u listu izabranih tagova
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Postojeci tagovi</label>
                        <div className="tag-picker">
                            {tags.length === 0 ? (
                                <div className="news-grid-empty">Nema tagova za izbor</div>
                            ) : (
                                tags.map((tag) => (
                                    <label key={tag.id} className={`tag-choice ${form.tags.includes(tag.name) ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={form.tags.includes(tag.name)}
                                            onChange={() => handleTagToggle(tag.name)}
                                            disabled={saving}
                                        />
                                        <span>#{tag.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button className="btn-primary" type="submit" disabled={saving}>
                        {saving ? 'Cuvanje...' : 'Dodaj pricu'}
                    </button>
                </form>

                <div className="admin-table-wrap">
                    <div className="header">
                        <h2>Postojece price</h2>
                        <form className="news-management-search" onSubmit={(event) => {
                            event.preventDefault();
                            setCurrentPage(1);
                            loadNews();
                        }}>
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Pretraga po naslovu ili sadrzaju"
                            />
                            <button type="submit" className="btn-primary">Pretrazi</button>
                        </form>
                    </div>

                    {loading ? (
                        <div className="loading">Ucitavanje prica...</div>
                    ) : visibleNews.length === 0 ? (
                        <div className="news-grid-empty">Nema prica za prikaz</div>
                    ) : (
                        <>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Naslov</th>
                                        <th>Kategorija</th>
                                        <th>Autor</th>
                                        <th>Tagovi</th>
                                        <th>Kreirano</th>
                                        <th>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleNews.map((newsItem) => (
                                        <tr key={newsItem.id}>
                                            <td>{newsItem.title}</td>
                                            <td>{newsItem.category_name || '-'}</td>
                                            <td>{newsItem.author_name || '-'}</td>
                                            <td>{newsItem.tags?.map((tag) => tag.name).join(', ') || '-'}</td>
                                            <td>{new Date(newsItem.published_at).toLocaleDateString('sr-RS')}</td>
                                            <td>
                                                <div className="actions">
                                                    {canDelete(newsItem) && (
                                                        <button
                                                            type="button"
                                                            className="delete"
                                                            onClick={() => handleDelete(newsItem.id)}
                                                            disabled={deletingId === newsItem.id}
                                                        >
                                                            {deletingId === newsItem.id ? 'Brisanje...' : 'Obrisi'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {!loading && totalPages > 1 && (
                                <div className="pagination-bar">
                                    <button className="pagination-btn" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                                        Prethodna
                                    </button>
                                    <span>Strana {currentPage} od {totalPages}</span>
                                    <button className="pagination-btn" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                                        Sledeca
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsManagement;