export type UserType = 'admin' | 'creator';
export type UserStatus = 'active' | 'inactive';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: UserType;
    status: UserStatus;
    created_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    user: User;
    token: string;
}

export interface CreateUserDto {
    email: string;
    first_name: string;
    last_name: string;
    user_type: UserType;
    password: string;
    confirm_password: string;
}

export interface UpdateUserDto {
    first_name?: string;
    last_name?: string;
    email?: string;
    user_type?: UserType;
    status?: UserStatus;
}