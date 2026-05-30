import { Router } from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// javne rute (svi mogu da vide kategorije)
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// zaštićene rute (samo admin)
router.post('/', authMiddleware, adminMiddleware, createCategory);
router.put('/:id', authMiddleware, adminMiddleware, updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

export default router;