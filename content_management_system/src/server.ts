import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { testConnection } from './utils/db';

// ucitati environment varijable
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// test ruta
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend radi!', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import newsRoutes from './routes/newsRoutes';
import commentRoutes from './routes/commentRoutes';
import tagRoutes from './routes/tagRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tags', tagRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Ruta ${req.originalUrl} nije pronađena` });
});

// globalni error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Greška:', err.stack);
    res.status(500).json({ error: 'Nešto je pošlo po zlu!' });
});

// pokretanje servera
const startServer = async (): Promise<void> => {
    await testConnection();
    
    app.listen(PORT, () => {
        console.log(`Server radi na http://localhost:${PORT}`);
        console.log(`Test ruta: http://localhost:${PORT}/api/health`);
        console.log(`Login ruta: POST http://localhost:${PORT}/api/auth/login`);
    });
};

startServer();