import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../utils/db';
import { hashPassword, verifyPassword } from '../utils/helpers';
import { LoginRequest, LoginResponse, UserResponse, CreateUserRequest, UpdateUserRequest } from '../types/userTypes';
import { AuthenticatedRequest } from '../types/requestTypes';

// login
export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
        res.status(400).json({ error: 'Email i lozinka su obavezni' });
        return;
    }
    
    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        const rows = users as any[];
        if (rows.length === 0) {
            res.status(401).json({ error: 'Pogrešan email ili lozinka' });
            return;
        }
        
        const user = rows[0];
        
        if (user.status !== 'active') {
            res.status(401).json({ error: 'Vaš nalog nije aktivan' });
            return;
        }
        
        if (!verifyPassword(password, user.password_hash)) {
            res.status(401).json({ error: 'Pogrešan email ili lozinka' });
            return;
        }
        
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                user_type: user.user_type,
                first_name: user.first_name,
                last_name: user.last_name
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
        
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        const { password_hash, ...userWithoutPassword } = user;
        
        const response: LoginResponse = {
            success: true,
            user: userWithoutPassword as UserResponse,
            token
        };
        
        res.json(response);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška na serveru' });
    }
};

// logout
export const logout = (req: Request, res: Response): void => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Uspešno odjavljeni' });
};

// dohvatanje trenutnog korisnika
export const getMe = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    
    try {
        const [users] = await pool.query(
            'SELECT id, email, first_name, last_name, user_type, status, created_at FROM users WHERE id = ?',
            [authReq.user.id]
        );
        
        const rows = users as any[];
        if (rows.length === 0) {
            res.status(404).json({ error: 'Korisnik nije pronađen' });
            return;
        }
        
        res.json(rows[0] as UserResponse);
    } catch (error) {
        res.status(500).json({ error: 'Greška na serveru' });
    }
};

// kreiranje korisnika
export const createUser = async (req: Request, res: Response): Promise<void> => {
    const {
        email,
        first_name,
        last_name,
        user_type,
        password,
        confirm_password
    }: CreateUserRequest = req.body;

    if (!email || !first_name || !last_name || !user_type || !password || !confirm_password) {
        res.status(400).json({ error: 'Sva polja su obavezna' });
        return;
    }

    if (password !== confirm_password) {
        res.status(400).json({ error: 'Lozinke se ne poklapaju' });
        return;
    }

    if (!['admin', 'creator'].includes(user_type)) {
        res.status(400).json({ error: 'Nevažeći tip korisnika' });
        return;
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        const existingRows = existingUsers as any[];

        if (existingRows.length > 0) {
            await connection.rollback();
            res.status(409).json({ error: 'Korisnik sa ovim email-om već postoji' });
            return;
        }

        const passwordHash = hashPassword(password);

        const [result] = await connection.query(
            `INSERT INTO users (email, first_name, last_name, user_type, status, password_hash)
             VALUES (?, ?, ?, ?, 'active', ?)`,
            [email, first_name, last_name, user_type, passwordHash]
        );

        await connection.commit();

        const insertResult = result as any;

        const [users] = await pool.query(
            `SELECT id, email, first_name, last_name, user_type, status
             FROM users WHERE id = ?`,
            [insertResult.insertId]
        );

        res.status(201).json({
            success: true,
            user: (users as any[])[0] as UserResponse
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Greška na serveru' });
    }finally {
        connection.release();
    }
};

// izmena korisnika 
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { first_name, last_name, email, user_type, status }: UpdateUserRequest = req.body;

    if (!id) {
        res.status(400).json({ error: 'ID korisnika je obavezan' });
        return;
    }

    if (!first_name && !last_name && !email && !user_type && !status) {
        res.status(400).json({ error: 'Nijedno polje za izmenu nije prosleđeno' });
        return;
    }

    if (user_type && !['admin', 'creator'].includes(user_type)) {
        res.status(400).json({ error: 'Nevažeći tip korisnika' });
        return;
    }

    if (status && !['active', 'inactive'].includes(status)) {
        res.status(400).json({ error: 'Nevažeći status korisnika' });
        return;
    }

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();
        const [users] = await connection.query('SELECT id FROM users WHERE id = ?', [id]);
        const userRows = users as any[];

        if (userRows.length === 0) {
            await connection.rollback();
            res.status(404).json({ error: 'Korisnik nije pronađen' });
            return;
        }

        if (email) {
            const [existingUsers] = await connection.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );
            const existingRows = existingUsers as any[];

            if (existingRows.length > 0) {
                await connection.rollback();
                res.status(409).json({ error: 'Email je već zauzet' });
                return;
            }
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (first_name) {
            fields.push('first_name = ?');
            values.push(first_name);
        }
        if (last_name) {
            fields.push('last_name = ?');
            values.push(last_name);
        }
        if (email) {
            fields.push('email = ?');
            values.push(email);
        }
        if (user_type) {
            fields.push('user_type = ?');
            values.push(user_type);
        }
        if (status) {
            fields.push('status = ?');
            values.push(status);
        }

        values.push(id);

        await connection.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        await connection.commit();

        const [updatedUsers] = await pool.query(
            `SELECT id, email, first_name, last_name, user_type, status
             FROM users WHERE id = ?`,
            [id]
        );

        res.json({
            success: true,
            user: (updatedUsers as any[])[0] as UserResponse
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška na serveru' });
    }finally {
        connection.release();
    }
};

// brisanje korisnika
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const authReq = req as AuthenticatedRequest;

    if (!id) {
        res.status(400).json({ error: 'ID korisnika je obavezan' });
        return;
    }

    if (Number(id) === authReq.user.id) {
        res.status(400).json({ error: 'Ne možete obrisati sopstveni nalog' });
        return;
    }

    try {
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
        const userRows = users as any[];

        if (userRows.length === 0) {
            res.status(404).json({ error: 'Korisnik nije pronađen' });
            return;
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        res.json({ success: true, message: 'Korisnik je uspešno obrisan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška na serveru' });
    }
};

// Dohvati sve korisnike (samo admin)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const [users] = await pool.query(
            `SELECT id, email, first_name, last_name, user_type, status FROM users`
        );

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška na serveru' });
    }
};