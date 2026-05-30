import { Router } from 'express';
import { login, logout, getMe, createUser, updateUser, deleteUser } from '../controllers/authController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// javne rute
router.post('/login/', login);
router.post('/logout/', logout);

// zaštićene rute
router.get('/me/', authMiddleware, getMe);

// admin rute za korisnike
router.post('/users/', authMiddleware, adminMiddleware, createUser);
router.put('/users/:id/', authMiddleware, adminMiddleware, updateUser);
router.delete('/users/:id/', authMiddleware, adminMiddleware, deleteUser);

export default router;