import { Router } from 'express';
import {
    getAllNews,
    getNewsById,
    getMostReadNews,
    getLatestNews,
    getRelatedNews,
    registerView,
    likeNews,
    dislikeNews,
    createNews,
    updateNews,
    deleteNews
} from '../controllers/newsController';
import { authMiddleware, ownerOrAdminMiddleware } from '../middleware/auth';

const router = Router();

// javne rute
router.get('/', getAllNews);
router.get('/most-read', getMostReadNews);
router.get('/latest', getLatestNews);
router.get('/:id', getNewsById);
router.get('/:id/related', getRelatedNews);
router.post('/:id/view', registerView);
router.post('/:id/like', likeNews);
router.post('/:id/dislike', dislikeNews);

// zaštićene rute (zahtevaju login)
router.post('/', authMiddleware, createNews);
router.put('/:id', authMiddleware, ownerOrAdminMiddleware, updateNews);
router.delete('/:id', authMiddleware, ownerOrAdminMiddleware, deleteNews);

export default router;