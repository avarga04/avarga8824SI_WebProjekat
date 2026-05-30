import { Request, Response } from 'express';
import pool from '../utils/db';
import { CommentDb, CreateCommentRequest } from '../types/commentTypes';

// dohvati komentare za jednu vest
export const getCommentsByNewsId = async (req: Request, res: Response): Promise<void> => {
    const newsId = req.params.newsId as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const offset = (page - 1) * limit;
    
    try {
        const [comments] = await pool.query(
            `SELECT c.*
             FROM comments c
             WHERE c.news_id = ?
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [newsId, limit, offset]
        );
        
        const [totalResult] = await pool.query(
            'SELECT COUNT(*) as total FROM comments WHERE news_id = ?',
            [newsId]
        );
        
        const total = (totalResult as any[])[0].total;
        
        res.json({
            data: comments,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju komentara' });
    }
};

// kreiraj novi komentar
export const createComment = async (req: Request, res: Response): Promise<void> => {
    const { author_name, content, news_id }: CreateCommentRequest = req.body;
    
    if (!author_name || author_name.trim() === '') {
        res.status(400).json({ error: 'Ime autora je obavezno' });
        return;
    }
    
    if (!content || content.trim() === '') {
        res.status(400).json({ error: 'Tekst komentara je obavezan' });
        return;
    }
    
    if (!news_id) {
        res.status(400).json({ error: 'ID vesti je obavezan' });
        return;
    }
    
    try {
        // provera da li vest postoji
        const [newsExists] = await pool.query('SELECT id FROM news WHERE id = ?', [news_id]);
        const newsRows = newsExists as any[];
        
        if (newsRows.length === 0) {
            res.status(404).json({ error: 'Vest ne postoji' });
            return;
        }
        
        const [result] = await pool.query(
            'INSERT INTO comments (author_name, content, news_id) VALUES (?, ?, ?)',
            [author_name.trim(), content.trim(), news_id]
        );
        
        const insertResult = result as any;
        const [newComment] = await pool.query('SELECT * FROM comments WHERE id = ?', [insertResult.insertId]);
        const newRows = newComment as CommentDb[];
        
        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri kreiranju komentara' });
    }
};

// obrisi komentar 
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    
    try {
        const [existing] = await pool.query('SELECT id FROM comments WHERE id = ?', [id]);
        const existingRows = existing as any[];
        
        if (existingRows.length === 0) {
            res.status(404).json({ error: 'Komentar nije pronađen' });
            return;
        }
        
        await pool.query('DELETE FROM comments WHERE id = ?', [id]);
        res.json({ success: true, message: 'Komentar uspešno obrisan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri brisanju komentara' });
    }
};

// lajk
export const likeComment = async (req: Request, res: Response): Promise<void> => {
    const commentId = req.params.id as string;
    const sessionId = req.cookies.session_id || req.headers['x-session-id'] || `session_${Date.now()}_${Math.random()}`;
    
    try {
        const [existing] = await pool.query(
            'SELECT id, reaction_type FROM comment_reactions WHERE comment_id = ? AND session_id = ?',
            [commentId, sessionId]
        );
        const existingRows = existing as any[];
        
        if (existingRows.length > 0) {
            // ako je vec lajkovao, ukloni lajk 
            if (existingRows[0].reaction_type === 'like') {
                await pool.query('DELETE FROM comment_reactions WHERE id = ?', [existingRows[0].id]);
                await pool.query('UPDATE comments SET likes = likes - 1 WHERE id = ?', [commentId]);
                res.json({ success: true, action: 'removed', message: 'Lajk uklonjen' });
            } else {
                // zameni dislike sa like
                await pool.query('UPDATE comment_reactions SET reaction_type = ? WHERE id = ?', ['like', existingRows[0].id]);
                await pool.query('UPDATE comments SET dislikes = dislikes - 1, likes = likes + 1 WHERE id = ?', [commentId]);
                res.json({ success: true, action: 'switched', message: 'Zamenjeno sa lajkom' });
            }
            return;
        }
        
        await pool.query(
            'INSERT INTO comment_reactions (comment_id, session_id, reaction_type) VALUES (?, ?, ?)',
            [commentId, sessionId, 'like']
        );
        await pool.query('UPDATE comments SET likes = likes + 1 WHERE id = ?', [commentId]);
        
        // postavi session cookie ako ne postoji
        if (!req.cookies.session_id) {
            res.cookie('session_id', sessionId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
        }
        
        res.json({ success: true, action: 'added', message: 'Lajkovano' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri lajkovanju komentara' });
    }
};

// dislajk
export const dislikeComment = async (req: Request, res: Response): Promise<void> => {
    const commentId = req.params.id as string;
    const sessionId = req.cookies.session_id || req.headers['x-session-id'] || `session_${Date.now()}_${Math.random()}`;
    
    try {
        const [existing] = await pool.query(
            'SELECT id, reaction_type FROM comment_reactions WHERE comment_id = ? AND session_id = ?',
            [commentId, sessionId]
        );
        const existingRows = existing as any[];
        
        if (existingRows.length > 0) {
            if (existingRows[0].reaction_type === 'dislike') {
                await pool.query('DELETE FROM comment_reactions WHERE id = ?', [existingRows[0].id]);
                await pool.query('UPDATE comments SET dislikes = dislikes - 1 WHERE id = ?', [commentId]);
                res.json({ success: true, action: 'removed', message: 'Dislajk uklonjen' });
                return;
            } else {
                await pool.query('UPDATE comment_reactions SET reaction_type = ? WHERE id = ?', ['dislike', existingRows[0].id]);
                await pool.query('UPDATE comments SET likes = likes - 1, dislikes = dislikes + 1 WHERE id = ?', [commentId]);
                res.json({ success: true, action: 'switched', message: 'Zamenjeno sa dislajkom' });
                return;
            }
        }
        
        await pool.query(
            'INSERT INTO comment_reactions (comment_id, session_id, reaction_type) VALUES (?, ?, ?)',
            [commentId, sessionId, 'dislike']
        );
        await pool.query('UPDATE comments SET dislikes = dislikes + 1 WHERE id = ?', [commentId]);
        
        if (!req.cookies.session_id) {
            res.cookie('session_id', sessionId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
        }
        
        res.json({ success: true, action: 'added', message: 'Dislajkovano' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri dislajkovanju komentara' });
    }
};