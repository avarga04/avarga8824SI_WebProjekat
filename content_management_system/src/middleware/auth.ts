import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../utils/db';
import { AuthenticatedRequest } from '../types/requestTypes';
import { JwtPayload } from '../types/userTypes';

// Proverava da li je korisnik ulogovan
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        res.status(401).json({ error: 'Niste ulogovani' });
        return;
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        (req as AuthenticatedRequest).user = decoded;

        const [users] = await pool.query('SELECT id, status, user_type FROM users WHERE id = ?', [decoded.id]);
        const userRows = users as any[];
        if (userRows.length === 0) {
            res.status(401).json({ error: 'Korisnik nije pronađen' });
            return;
        }

        const user = userRows[0];

        if(user.status !== 'active') {
            res.status(403).json({ error: 'Vaš nalog je neaktivan. Kontaktirajte administratora.' });
            return;
        }

        (req as AuthenticatedRequest).user.user_type = user.user_type;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Nevažeći token' });
    }
};

// Proverava da li je korisnik admin
export const adminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (authReq.user.user_type !== 'admin') {
        res.status(403).json({ error: 'Nemate dozvolu za ovu akciju' });
        return;
    }

    next();
};

// proverava da li je korisnik vlasnik vesti ili admin
export const ownerOrAdminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = req.params.id as string;
    
    if (authReq.user.user_type === 'admin') {
        next();
        return;
    }
    
    if (!id) {
        res.status(400).json({ error: 'ID vesti nije prosleđen' });
        return;
    }
    
    try {
        const [newsRows] = await pool.query(
            'SELECT author_id FROM news WHERE id = ?',
            [id]
        );
        
        const news = (newsRows as any[])[0];
        
        if (!news) {
            res.status(404).json({ error: 'Vest nije pronađena' });
            return;
        }
        
        if (news.author_id !== authReq.user.id) {
            res.status(403).json({ error: 'Nemate dozvolu za ovu akciju. Samo autor ili admin mogu da menjaju vest.' });
            return;
        }
        
        next();

    } catch (error) {
        console.error('OwnerOrAdmin middleware error:', error);
        res.status(500).json({ error: 'Greška pri proveri dozvola' });
    }
};