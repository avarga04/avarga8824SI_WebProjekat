import { Request, Response } from 'express';
import pool from '../utils/db';
import { AuthenticatedRequest } from '../types/requestTypes';
import {CreateNewsRequest, UpdateNewsRequest} from '../types/newsTypes';

// dohvati sve vesti 
export const getAllNews = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const search = req.query.search as string || '';
    const categoryId = req.query.category_id as string || '';
    const offset = (page - 1) * limit;
    
    try {
        let query = `
            SELECT n.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as author_name,
                   c.name as category_name,
                   (SELECT COUNT(*) FROM comments WHERE news_id = n.id) as comment_count
            FROM news n
            JOIN users u ON n.author_id = u.id
            JOIN categories c ON n.category_id = c.id
            WHERE 1=1
        `;
        
        const params: any[] = [];
        
        if (search) {
            query += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (categoryId) {
            query += ` AND n.category_id = ?`;
            params.push(categoryId);
        }
        
        query += ` ORDER BY n.published_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [news] = await pool.query(query, params);
        
        let countQuery = `SELECT COUNT(*) as total FROM news n WHERE 1=1`;
        const countParams: any[] = [];
        
        if (search) {
            countQuery += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        
        if (categoryId) {
            countQuery += ` AND n.category_id = ?`;
            countParams.push(categoryId);
        }
        
        const [totalResult] = await pool.query(countQuery, countParams);
        const total = (totalResult as any[])[0].total;
        
        res.json({
            data: news,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju vesti' });
    }
};

// dohvati jednu vest 
export const getNewsById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    
    try {
        const [news] = await pool.query(
            `SELECT n.*, 
                    u.id as author_id, u.first_name, u.last_name,
                    c.id as category_id, c.name as category_name, c.description as category_description,
                    (SELECT COUNT(*) FROM news_reactions WHERE news_id = n.id AND reaction_type = 'like') as like_count,
                    (SELECT COUNT(*) FROM news_reactions WHERE news_id = n.id AND reaction_type = 'dislike') as dislike_count
             FROM news n
             JOIN users u ON n.author_id = u.id
             JOIN categories c ON n.category_id = c.id
             WHERE n.id = ?`,
            [id]
        );
        
        const newsRows = news as any[];
        if (newsRows.length === 0) {
            res.status(404).json({ error: 'Vest nije pronađena' });
            return;
        }
        
        const newsItem = newsRows[0];
        
        const [tags] = await pool.query(
            `SELECT t.id, t.name 
             FROM tags t
             JOIN news_tags nt ON t.id = nt.tag_id
             WHERE nt.news_id = ?`,
            [id]
        );
        
        newsItem.tags = tags;
        
        res.json(newsItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju vesti' });
    }
};

// dohvati najcitanije vesti 
export const getMostReadNews = async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string || '10');
    
    try {
        const [news] = await pool.query(
            `SELECT n.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as author_name,
                    c.name as category_name,
                    (SELECT COUNT(*) FROM comments WHERE news_id = n.id) as comment_count
             FROM news n
             JOIN users u ON n.author_id = u.id
             JOIN categories c ON n.category_id = c.id
             WHERE n.published_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             ORDER BY n.views DESC
             LIMIT ?`,
            [limit]
        );
        
        res.json(news);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju najčitanijih vesti' });
    }
};

// dohvati najnovije vesti 
export const getLatestNews = async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string || '10'); 
    
    try {
        const [news] = await pool.query(
            `SELECT n.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as author_name,
                    c.name as category_name,
                    LEFT(n.content, 200) as content_preview,
                    (SELECT COUNT(*) FROM comments WHERE news_id = n.id) as comment_count
             FROM news n
             JOIN users u ON n.author_id = u.id
             JOIN categories c ON n.category_id = c.id
             ORDER BY n.published_at DESC
             LIMIT ?`,
            [limit]
        );
        
        res.json(news);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju najnovijih vesti' });
    }
};

// dohvati srodne vesti 
export const getRelatedNews = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const limit = parseInt(req.query.limit as string || '3');
    
    try {
        const [tags] = await pool.query(
            'SELECT tag_id FROM news_tags WHERE news_id = ?',
            [id]
        );
        const tagRows = tags as any[];
        
        if (tagRows.length === 0) {
            res.json([]);
            return;
        }
        
        const tagIds = tagRows.map(t => t.tag_id);
        
        // ovo su sve vesti koje dele tagove pa ih hvata
        const [related] = await pool.query(
            `SELECT DISTINCT n.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as author_name,
                    c.name as category_name,
                    LEFT(n.content, 200) as content_preview
             FROM news n
             JOIN news_tags nt ON n.id = nt.news_id
             JOIN users u ON n.author_id = u.id
             JOIN categories c ON n.category_id = c.id
             WHERE nt.tag_id IN (?) AND n.id != ?
             ORDER BY n.published_at DESC
             LIMIT ?`,
            [tagIds, id, limit]
        );
        
        res.json(related);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju srodnih vesti' });
    }
};

// registruj pregled vesti 
export const registerView = async (req: Request, res: Response): Promise<void> => {
    const newsId = req.params.id as string;
    const sessionId = req.cookies.session_id || req.headers['x-session-id'] || `session_${Date.now()}_${Math.random()}`;
    
    try {
        // ovde gledamo da li je vec registrovan pregled za ovu vest i ovu sesiju
        const [existing] = await pool.query(
            'SELECT id FROM news_views WHERE news_id = ? AND session_id = ?',
            [newsId, sessionId]
        );
        const existingRows = existing as any[];
        
        if (existingRows.length === 0) {
            // zabelezi novi pregled
            await pool.query(
                'INSERT INTO news_views (news_id, session_id) VALUES (?, ?)',
                [newsId, sessionId]
            );

            await pool.query('UPDATE news SET views = views + 1 WHERE id = ?', [newsId]);
            
            if (!req.cookies.session_id) {
                res.cookie('session_id', sessionId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri registrovanju pregleda' });
    }
};

// lajk 
export const likeNews = async (req: Request, res: Response): Promise<void> => {
    const newsId = req.params.id as string;
    const sessionId = req.cookies.session_id || req.headers['x-session-id'] || `session_${Date.now()}_${Math.random()}`;
    
    try {
        const [existing] = await pool.query(
            'SELECT id, reaction_type FROM news_reactions WHERE news_id = ? AND session_id = ?',
            [newsId, sessionId]
        );
        const existingRows = existing as any[];
        
        if (existingRows.length > 0) {
            if (existingRows[0].reaction_type === 'like') {
                await pool.query('DELETE FROM news_reactions WHERE id = ?', [existingRows[0].id]);
                await pool.query('UPDATE news SET likes = likes - 1 WHERE id = ?', [newsId]);
                res.json({ success: true, action: 'removed', message: 'Lajk uklonjen' });
                return;
            }
        }
        
        if (existingRows.length > 0 && existingRows[0].reaction_type === 'dislike') {
            await pool.query('UPDATE news_reactions SET reaction_type = ? WHERE id = ?', ['like', existingRows[0].id]);
            await pool.query('UPDATE news SET dislikes = dislikes - 1, likes = likes + 1 WHERE id = ?', [newsId]);
            res.json({ success: true, action: 'switched', message: 'Zamenjeno sa lajkom' });
            return;
        }
        
        await pool.query(
            'INSERT INTO news_reactions (news_id, session_id, reaction_type) VALUES (?, ?, ?)',
            [newsId, sessionId, 'like']
        );
        await pool.query('UPDATE news SET likes = likes + 1 WHERE id = ?', [newsId]);
        
        if (!req.cookies.session_id) {
            res.cookie('session_id', sessionId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
        }
        
        res.json({ success: true, action: 'added', message: 'Lajkovano' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri lajkovanju' });
    }
};

// Dislajk
export const dislikeNews = async (req: Request, res: Response): Promise<void> => {
    const newsId = req.params.id as string;
    const sessionId = req.cookies.session_id || req.headers['x-session-id'] || `session_${Date.now()}_${Math.random()}`;
    
    try {
        const [existing] = await pool.query(
            'SELECT id, reaction_type FROM news_reactions WHERE news_id = ? AND session_id = ?',
            [newsId, sessionId]
        );
        const existingRows = existing as any[];
        
        if (existingRows.length > 0) {
            if (existingRows[0].reaction_type === 'dislike') {
                await pool.query('DELETE FROM news_reactions WHERE id = ?', [existingRows[0].id]);
                await pool.query('UPDATE news SET dislikes = dislikes - 1 WHERE id = ?', [newsId]);
                res.json({ success: true, action: 'removed', message: 'Dislajk uklonjen' });
                return;
            }
        }
        
        if (existingRows.length > 0 && existingRows[0].reaction_type === 'like') {
            await pool.query('UPDATE news_reactions SET reaction_type = ? WHERE id = ?', ['dislike', existingRows[0].id]);
            await pool.query('UPDATE news SET likes = likes - 1, dislikes = dislikes + 1 WHERE id = ?', [newsId]);
            res.json({ success: true, action: 'switched', message: 'Zamenjeno sa dislajkom' });
            return;
        }
        
        await pool.query(
            'INSERT INTO news_reactions (news_id, session_id, reaction_type) VALUES (?, ?, ?)',
            [newsId, sessionId, 'dislike']
        );
        await pool.query('UPDATE news SET dislikes = dislikes + 1 WHERE id = ?', [newsId]);

        if (!req.cookies.session_id) {
            res.cookie('session_id', sessionId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
        }
        
        res.json({ success: true, action: 'added', message: 'Dislajkovano' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri dislajkovanju' });
    }
};

// kreiraj novu vest
export const createNews = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { title, content, category_id, tags }: CreateNewsRequest = authReq.body;
    const author_id = authReq.user.id;
    
    if (!title || title.trim() === '') {
        res.status(400).json({ error: 'Naslov je obavezan' });
        return;
    }
    
    if (!content || content.trim() === '') {
        res.status(400).json({ error: 'Tekst vesti je obavezan' });
        return;
    }
    
    if (!category_id) {
        res.status(400).json({ error: 'Kategorija je obavezna' });
        return;
    }
    
    try {
        // gledamo da li kategorija postoji
        const [categoryExists] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
        if ((categoryExists as any[]).length === 0) {
            res.status(400).json({ error: 'Kategorija ne postoji' });
            return;
        }
        
        const [result] = await pool.query(
            'INSERT INTO news (title, content, author_id, category_id) VALUES (?, ?, ?, ?)',
            [title.trim(), content.trim(), author_id, category_id]
        );
        
        const insertResult = result as any;
        const newsId = insertResult.insertId;
        
        // obrada tagova
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                const tagNameTrimmed = tagName.trim().toLowerCase();
                if (tagNameTrimmed === '') continue;
                
                let [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagNameTrimmed]);
                let tagRowsArray = tagRows as any[];
                let tagId;
                
                if (tagRowsArray.length === 0) {
                    const [newTag] = await pool.query('INSERT INTO tags (name) VALUES (?)', [tagNameTrimmed]);
                    tagId = (newTag as any).insertId;
                } else {
                    tagId = tagRowsArray[0].id;
                }
                
                // ovde bsada vezujemo vest i tag u many-to-many tabeli
                await pool.query(
                    'INSERT INTO news_tags (news_id, tag_id) VALUES (?, ?)',
                    [newsId, tagId]
                );
            }
        }
        
        // vracamo kreiranu vest
        const [newNews] = await pool.query(
            `SELECT n.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as author_name,
                    c.name as category_name
             FROM news n
             JOIN users u ON n.author_id = u.id
             JOIN categories c ON n.category_id = c.id
             WHERE n.id = ?`,
            [newsId]
        );
        
        res.status(201).json((newNews as any[])[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri kreiranju vesti' });
    }
};

// izmeni vest
export const updateNews = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = authReq.params.id as string;
    const { title, content, category_id, tags }: UpdateNewsRequest = authReq.body;
    
    try {        
        const updates: string[] = [];
        const values: any[] = [];
        
        if (title) {
            updates.push('title = ?');
            values.push(title.trim());
        }
        if (content) {
            updates.push('content = ?');
            values.push(content.trim());
        }
        if (category_id) {
            updates.push('category_id = ?');
            values.push(category_id);
        }
        
        if (updates.length > 0) {
            values.push(id);
            await pool.query(
                `UPDATE news SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }
        
        // azuriraj tagove ako su poslati
        if (tags) {
            //prvo cemo da obrisemo tagove koji postoje pa cemo dodati nove, pa i ako su vec postojali opet cemo ih dodati
            await pool.query('DELETE FROM news_tags WHERE news_id = ?', [id]);
            
            for (const tagName of tags) {
                const tagNameTrimmed = tagName.trim().toLowerCase();
                if (tagNameTrimmed === '') continue;
                
                let [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagNameTrimmed]);
                let tagRowsArray = tagRows as any[];
                let tagId;
                
                if (tagRowsArray.length === 0) {
                    const [newTag] = await pool.query('INSERT INTO tags (name) VALUES (?)', [tagNameTrimmed]);
                    tagId = (newTag as any).insertId;
                } else {
                    tagId = tagRowsArray[0].id;
                }
                
                await pool.query(
                    'INSERT INTO news_tags (news_id, tag_id) VALUES (?, ?)',
                    [id, tagId]
                );
            }
        }
        
        const [updatedNews] = await pool.query(
            `SELECT n.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as author_name,
                    c.name as category_name
             FROM news n
             JOIN users u ON n.author_id = u.id
             JOIN categories c ON n.category_id = c.id
             WHERE n.id = ?`,
            [id]
        );
        
        res.json((updatedNews as any[])[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri izmeni vesti' });
    }
};

// obrisi vest 
export const deleteNews = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = authReq.params.id as string;
    
    try {
        await pool.query('DELETE FROM news WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Vest uspešno obrisana' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri brisanju vesti' });
    }
};