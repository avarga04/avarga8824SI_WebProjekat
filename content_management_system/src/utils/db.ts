import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// kreiranje connection pool-a
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cms_vesti',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// test konekcije
export const testConnection = async (): Promise<boolean> => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL connected successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('MySQL connection failed:', error);
        return false;
    }
};

export default pool;