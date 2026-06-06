import React, { useState, useEffect } from 'react';
import { getCategories } from '../../services/categoryService';
import type { Category } from '../../types/categoryTypes';

interface FilterBarProps {
    onFilterChange: (filterType: string, value?: number) => void;
    activeFilter: string;
    selectedCategoryId?: number | null;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
    onFilterChange, 
    activeFilter, 
    selectedCategoryId 
}) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Greska pri ucitavanju kategorija:', error);
        }
    };

    const handleCategorySelect = (categoryId: number) => {
        onFilterChange('category', categoryId);
        setShowCategoryDropdown(false);
    };

    return (
        <div className="filter-bar">
            <button 
                className={`filter-btn ${activeFilter === 'latest' ? 'active' : ''}`}
                onClick={() => onFilterChange('latest')}
            >
                 Najnovije
            </button>
            
            <button 
                className={`filter-btn ${activeFilter === 'most-read' ? 'active' : ''}`}
                onClick={() => onFilterChange('most-read')}
            >
                 Najcitanije
            </button>
            
            <div className="category-dropdown">
                <button 
                    className={`filter-btn ${activeFilter === 'category' ? 'active' : ''}`}
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                     Kategorije {selectedCategoryId && " "}
                </button>
                
                {showCategoryDropdown && (
                    <div className="dropdown-menu">
                        <div 
                            className="dropdown-item"
                            onClick={() => onFilterChange('latest')}
                        >
                            Sve vesti
                        </div>
                        {categories.map(category => (
                            <div 
                                key={category.id}
                                className={`dropdown-item ${selectedCategoryId === category.id ? 'selected' : ''}`}
                                onClick={() => handleCategorySelect(category.id)}
                            >
                                {category.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterBar;