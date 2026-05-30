import crypto from 'crypto';

// hashovanje lozinke (SHA256)
export const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// provera lozinke
export const verifyPassword = (password: string, hash: string): boolean => {
    return hashPassword(password) === hash;
};


