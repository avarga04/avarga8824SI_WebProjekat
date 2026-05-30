import { Request } from 'express';
import { JwtPayload } from './userTypes';

export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}
