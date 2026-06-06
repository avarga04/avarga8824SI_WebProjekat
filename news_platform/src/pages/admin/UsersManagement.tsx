import React, { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../services/userService';
import type { User, CreateUserDto} from '../../types/userTypes';

const UsersManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [form, setForm] = useState<CreateUserDto>({
        email: '',
        first_name: '',
        last_name: '',
        user_type: 'creator',
        password: '',
        confirm_password: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri ucitavanju korisnika');
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
            await createUser(form);
            setForm({ email: '', first_name: '', last_name: '', user_type: 'creator', password: '', confirm_password: '' });
            setSuccess('Korisnik je uspešno dodat.');
            await loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri kreiranju korisnika');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: number) => {
        const confirmed = window.confirm('Da li zelite da obrisete ovog korisnika?');
        if (!confirmed) return;

        setDeletingId(userId);
        setError(null);
        setSuccess(null);

        try {
            await deleteUser(userId);
            setSuccess('Korisnik je uspešno obrisan.');
            await loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri brisanju korisnika');
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusChange = async (userId: number, newStatus: string) => {
        setError(null);
        setSuccess(null);
        try {
            await updateUser(userId, { status: newStatus as any });
            setSuccess('Status je ažuriran.');
            await loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Greska pri azuriranju statusa');
        }
    };

    return (
        <div className="admin-page">
            <div className="header">
                <div>
                    <h1>Upravljanje korisnicima</h1>
                </div>
            </div>

            <div className="admin-panel">
                <form className="admin-form" onSubmit={handleSubmit}>
                    <h2>Novi korisnik</h2>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={saving} />
                    </div>

                    <div className="form-group">
                        <label>Ime</label>
                        <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required disabled={saving} />
                    </div>

                    <div className="form-group">
                        <label>Prezime</label>
                        <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required disabled={saving} />
                    </div>

                    <div className="form-group">
                        <label>Tip korisnika</label>
                        <select value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value as any })} disabled={saving}>
                            <option value="creator">creator</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Lozinka</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required disabled={saving} />
                    </div>

                    <div className="form-group">
                        <label>Potvrdi lozinku</label>
                        <input type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required disabled={saving} />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Cuvanje...' : 'Dodaj korisnika'}</button>
                </form>

                <div className="admin-table-wrap">
                    <h2>Postojeci korisnici</h2>

                    {loading ? (
                        <div className="loading">Ucitavanje korisnika...</div>
                    ) : users.length === 0 ? (
                        <div className="news-grid-empty">Nema korisnika za prikaz</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Ime</th>
                                    <th>Prezime</th>
                                    <th>Tip</th>
                                    <th>Status</th>
                                    <th>Kreirano</th>
                                    <th>Akcije</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.email}</td>
                                        <td>{u.first_name}</td>
                                        <td>{u.last_name}</td>
                                        <td>{u.user_type}</td>
                                        <td>
                                            <select value={u.status} onChange={(e) => handleStatusChange(u.id, e.target.value)}>
                                                <option value="active">active</option>
                                                <option value="inactive">inactive</option>
                                            </select>
                                        </td>
                                        <td>{new Date(u.created_at).toLocaleDateString('sr-RS')}</td>
                                        <td>
                                            <div className="actions">
                                                <button type="button" className="delete" onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}>{deletingId === u.id ? 'Brisanje...' : 'Obrisi'}</button>
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

export default UsersManagement;
