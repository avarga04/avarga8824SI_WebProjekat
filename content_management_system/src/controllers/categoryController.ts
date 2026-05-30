import { Request, Response } from 'express';
import pool from '../utils/db';
import { CategoryDb, CreateCategoryRequest, UpdateCategoryRequest } from '../types/categoryTypes';

// dohvati sve kategorije
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const [categories] = await pool.query(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri učitavanju kategorija' });
    }
};

// dohvati jednu kategoriju
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    try {
        const [categories] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        
        const rows = categories as CategoryDb[];
        if (rows.length === 0) {
            res.status(404).json({ error: 'Kategorija nije pronađena' });
            return;
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Greška na serveru' });
    }
};

// kreiraj novu kategoriju
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    const { name, description }: CreateCategoryRequest = req.body;
    
    if (!name || !description) {
        res.status(400).json({ error: 'Ime i opis su obavezni' });
        return;
    }
    
    try {
        const [existing] = await pool.query(
            'SELECT id FROM categories WHERE name = ?',
            [name]
        );
        
        const existingRows = existing as any[];
        if (existingRows.length > 0) {
            res.status(400).json({ error: 'Kategorija sa tim imenom već postoji' });
            return;
        }
        
        const [result] = await pool.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        
        const insertResult = result as any;
        const [newCategory] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [insertResult.insertId]
        );
        
        const newRows = newCategory as CategoryDb[];
        res.status(201).json(newRows[0]);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri kreiranju kategorije' });
    }
};

// izmeni kategoriju
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description }: UpdateCategoryRequest = req.body;
    
    if (!name && !description) {
        res.status(400).json({ error: 'Bar jedno polje za izmenu je obavezno' });
        return;
    }
    
    try {
        const [existing] = await pool.query(
            'SELECT id FROM categories WHERE id = ?',
            [id]
        );
        
        const existingRows = existing as any[];
        if (existingRows.length === 0) {
            res.status(404).json({ error: 'Kategorija nije pronađena' });
            return;
        }
        
        if (name) {
            const [duplicate] = await pool.query(
                'SELECT id FROM categories WHERE name = ? AND id != ?',
                [name, id]
            );
            
            const duplicateRows = duplicate as any[];
            if (duplicateRows.length > 0) {
                res.status(400).json({ error: 'Kategorija sa tim imenom već postoji' });
                return;
            }
        }
        
        const updates: string[] = [];
        const values: any[] = [];
        
        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description) {
            updates.push('description = ?');
            values.push(description);
        }
        
        values.push(id);
        
        await pool.query(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        const [updated] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        
        const updatedRows = updated as CategoryDb[];
        res.json(updatedRows[0]);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri izmeni kategorije' });
    }
};

// obrisi kategoriju
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    try {
        const [existing] = await pool.query(
            'SELECT id FROM categories WHERE id = ?',
            [id]
        );
        
        const existingRows = existing as any[];
        if (existingRows.length === 0) {
            res.status(404).json({ error: 'Kategorija nije pronađena' });
            return;
        }
        
        const [newsCount] = await pool.query(
            'SELECT COUNT(*) as count FROM news WHERE category_id = ?',
            [id]
        );
        
        const countRows = newsCount as any[];
        if (countRows[0].count > 0) {
            res.status(400).json({
                error: 'Ne možete obrisati kategoriju koja sadrži vesti. Prvo obrišite vesti u ovoj kategoriji.'
            });
            return;
        }
        
        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Kategorija uspešno obrisana' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Greška pri brisanju kategorije' });
    }
};