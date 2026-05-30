
export interface CategoryDb {
    id: number;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateCategoryRequest {
    name: string;
    description: string;
}

export interface UpdateCategoryRequest {
    name?: string;
    description?: string;
}

