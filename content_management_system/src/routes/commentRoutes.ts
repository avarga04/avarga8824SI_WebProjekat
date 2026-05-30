import { Router } from 'express';
import {
    getCommentsByNewsId,
    createComment,
    deleteComment,
    likeComment,
    dislikeComment
} from '../controllers/commentController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// javne rute
router.get('/news/:newsId', getCommentsByNewsId);
router.post('/', createComment);
router.post('/:id/like', likeComment);
router.post('/:id/dislike', dislikeComment);

// zaštićene rute (samo admin može brisati komentare)
router.delete('/:id', authMiddleware, adminMiddleware, deleteComment);

export default router;