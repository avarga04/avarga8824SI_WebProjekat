import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, deleteCategory } from '../../services/categoryService';
import type { Category, CreateCategoryDto } from '../../types/categoryTypes';

const CategoriesManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [form, setForm] = useState<CreateCategoryDto>({
        name: '',
        description: '',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCategories();
            setCategories(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri ucitavanju kategorija');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await createCategory(form);
            setForm({ name: '', description: '' });
            setSuccess('Kategorija je uspešno dodata.');
            await loadCategories();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri kreiranju kategorije');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (categoryId: number) => {
        const confirmed = window.confirm('Da li zelite da obrisete ovu kategoriju?');
        if (!confirmed) {
            return;
        }

        setDeletingId(categoryId);
        setError(null);
        setSuccess(null);

        try {
            await deleteCategory(categoryId);
            setSuccess('Kategorija je uspesno obrisana.');
            await loadCategories();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri brisanju kategorije');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="admin-page">
            <div className="header">
                <div>
                    <h1>Upravljanje kategorijama</h1>
                </div>
            </div>

            <div className="admin-panel">
                <form className="admin-form" onSubmit={handleSubmit}>
                    <h2>Nova kategorija</h2>

                    <div className="form-group">
                        <label htmlFor="category-name">Naziv</label>
                        <input
                            id="category-name"
                            type="text"
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            required
                            disabled={saving}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category-description">Opis</label>
                        <textarea
                            id="category-description"
                            rows={4}
                            value={form.description}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                            required
                            disabled={saving}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button className="btn-primary" type="submit" disabled={saving}>
                        {saving ? 'Cuvanje...' : 'Dodaj kategoriju'}
                    </button>
                </form>

                <div className="admin-table-wrap">
                    <h2>Postojece kategorije</h2>

                    {loading ? (
                        <div className="loading">Ucitavanje kategorija...</div>
                    ) : categories.length === 0 ? (
                        <div className="news-grid-empty">Nema kategorija za prikaz</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Naziv</th>
                                    <th>Opis</th>
                                    <th>Kreirano</th>
                                    <th>Akcije</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td>{category.name}</td>
                                        <td>{category.description}</td>
                                        <td>{new Date(category.created_at).toLocaleDateString('sr-RS')}</td>
                                        <td>
                                            <div className="actions">
                                                <button
                                                    type="button"
                                                    className="delete"
                                                    onClick={() => handleDelete(category.id)}
                                                    disabled={deletingId === category.id}
                                                >
                                                    {deletingId === category.id ? 'Brisanje...' : 'Obrisi'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoriesManagement;