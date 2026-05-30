import { Request, Response } from 'express';
import pool from '../utils/db';
import { TagDb } from '../types/tagTypes';

// odhvati sve tagove
export const getAllTags = async (req: Request, res: Response): Promise<void> => {
    try {
        const [tags] = await pool.query('SELECT * FROM tags ORDER BY name');
        res.json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju tagova' });
    }
};

// dohvati tag po ID
export const getTagById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    
    try {
        const [tags] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);
        const rows = tags as TagDb[];
        
        if (rows.length === 0) {
            res.status(404).json({ error: 'Tag nije pronađen' });
            return;
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Greška na serveru' });
    }
};

// dohvati sve vesti za dati tag
export const getNewsByTag = async (req: Request, res: Response): Promise<void> => {
    const tagId = req.params.id as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const offset = (page - 1) * limit;
    
    try {
        // dohvati vesti koje imaju ovaj tag
        const [news] = await pool.query(
            `SELECT n.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as author_name,
                    c.name as category_name
             FROM news n
             JOIN users u ON n.author_id = u.id
             JOIN categories c ON n.category_id = c.id
             JOIN news_tags nt ON n.id = nt.news_id
             WHERE nt.tag_id = ?
             ORDER BY n.published_at DESC
             LIMIT ? OFFSET ?`,
            [tagId, limit, offset]
        );
        
        // ukupan broj vesti za paginaciju
        const [totalResult] = await pool.query(
            'SELECT COUNT(*) as total FROM news_tags WHERE tag_id = ?',
            [tagId]
        );
        
        const total = (totalResult as any[])[0].total;
        
        res.json({
            data: news,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju vesti za tag' });
    }
};

// kreiraj novi tag 
export const createTag = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
        res.status(400).json({ error: 'Ime taga je obavezno' });
        return;
    }
    
    try {
        // provera da li već postoji
        const [existing] = await pool.query('SELECT id FROM tags WHERE name = ?', [name]);
        const existingRows = existing as any[];
        
        if (existingRows.length > 0) {
            res.status(400).json({ error: 'Tag sa tim imenom već postoji' });
            return;
        }
        
        const [result] = await pool.query('INSERT INTO tags (name) VALUES (?)', [name]);
        const insertResult = result as any;
        
        const [newTag] = await pool.query('SELECT * FROM tags WHERE id = ?', [insertResult.insertId]);
        const newRows = newTag as TagDb[];
        
        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri kreiranju taga' });
    }
};

// obrisi tag 
export const deleteTag = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    
    try {
        const [existing] = await pool.query('SELECT id FROM tags WHERE id = ?', [id]);
        const existingRows = existing as any[];
        
        if (existingRows.length === 0) {
            res.status(404).json({ error: 'Tag nije pronađen' });
            return;
        }
        
        await pool.query('DELETE FROM tags WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tag uspešno obrisan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri brisanju taga' });
    }
};