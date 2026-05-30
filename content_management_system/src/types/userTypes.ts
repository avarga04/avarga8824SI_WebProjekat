export type UserType = 'admin' | 'creator';
export type UserStatus = 'active' | 'inactive';

export interface UserDb {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: UserType;
    status: UserStatus;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}

export interface UserResponse {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: UserType;
    status: UserStatus;
    created_at: Date;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface CreateUserRequest {
    email: string;
    first_name: string;
    last_name: string;
    user_type: UserType;
    password: string;
    confirm_password: string;
}

export interface UpdateUserRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
    user_type?: UserType;
    status?: UserStatus;
}

export interface JwtPayload {
    id: number;
    email: string;
    user_type: UserType;
    first_name: string;
    last_name: string;
}

export interface LoginResponse {
    success: boolean;
    user: UserResponse;
    token: string;
}