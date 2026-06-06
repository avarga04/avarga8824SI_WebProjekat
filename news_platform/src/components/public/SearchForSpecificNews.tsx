import React from 'react';

interface SearchForSpecificNewsProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (event: React.FormEvent) => void;
	onClear: () => void;
	loading?: boolean;
}

const SearchForSpecificNews: React.FC<SearchForSpecificNewsProps> = ({
	value,
	onChange,
	onSubmit,
	onClear,
	loading = false,
}) => {
	return (
		<form className="news-search-bar" onSubmit={onSubmit}>
			<label className="sr-only" htmlFor="news-search-input">
				Pretraga vesti
			</label>

			<input
				id="news-search-input"
				className="news-search-input"
				type="search"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="Pretrazi vesti po naslovu ili sadrzaju"
				disabled={loading}
			/>

			<button className="btn-primary news-search-button" type="submit" disabled={loading}>
				Pretrazi
			</button>

			{value && (
				<button className="btn-primary news-search-button" type="button" onClick={onClear} disabled={loading}>
					Obrisi
				</button>
			)}
		</form>
	);
};

export default SearchForSpecificNews;
