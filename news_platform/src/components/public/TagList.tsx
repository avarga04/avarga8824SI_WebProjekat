import React from 'react';
import { Link } from 'react-router-dom';
import type { Tag } from '../../types/tagTypes';

interface TagListProps {
    tags: Tag[];
}

const TagList: React.FC<TagListProps> = ({ tags }) => {
    if (!tags || tags.length === 0) {
        return null;
    }

    return (
        <div className="tag-list">
            <span className="tag-label">Tagovi:</span>
            {tags.map((tag) => (
                <Link 
                    key={tag.id} 
                    to={`/tags/${tag.id}/news`}
                    className="tag"
                >
                    #{tag.name + " "}   
                </Link>
            ))}
        </div>
    );
};

export default TagList;