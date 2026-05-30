import { Router } from 'express';
import {
    getAllTags,
    getTagById,
    getNewsByTag,
    createTag,
    deleteTag
} from '../controllers/tagController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// javne rute
router.get('/', getAllTags);
router.get('/:id', getTagById);
router.get('/:id/news', getNewsByTag);

// zaštićene rute (zahtevaju login)
router.post('/', authMiddleware, createTag);

// zaštićene rute (samo admin)
router.delete('/:id', authMiddleware, adminMiddleware, deleteTag);

export default router;