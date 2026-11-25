import type { InventorySort, SortDir } from '../../api/inventory';
import type { CategoryNode } from '../../utils/categoryTree';
import CategorySelect from '../common/CategorySelect';
import { SORT_OPTIONS, type FilterState } from './filters';

interface Props {
    search: string;
    onSearchChange: (value: string) => void;
    filters: FilterState;
    onChange: (changes: Partial<FilterState>) => void;
    categories: CategoryNode[];
    locations: string[];
}

const InventoryFilters = ({ search, onSearchChange, filters, onChange, categories, locations }: Props) => {
    const active = filters.category != null || filters.location != null || search !== '';

    return (
        <div className="filters">
            <div className="field filters-search">
                <label htmlFor="inv-search">Search</label>
                <input
                    id="inv-search"
                    className="input"
                    type="search"
                    placeholder="Name, brand or EAN"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoComplete="off"
                />
            </div>
            <div className="field">
                <label htmlFor="inv-category">Category</label>
                <CategorySelect
                    id="inv-category"
                    options={categories}
                    value={filters.category}
                    onChange={(category) => onChange({ category })}
                    emptyLabel="All categories"
                />
            </div>
            <div className="field">
                <label htmlFor="inv-location">Location</label>
                <select
                    id="inv-location"
                    className="select"
                    value={filters.location ?? ''}
                    onChange={(e) => onChange({ location: e.target.value || null })}
                >
                    <option value="">All locations</option>
                    {locations.map((l) => (
                        <option key={l} value={l}>
                            {l}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label htmlFor="inv-sort">Sort</label>
                <select
                    id="inv-sort"
                    className="select"
                    value={`${filters.sort}:${filters.dir}`}
                    onChange={(e) => {
                        const [sort, dir] = e.target.value.split(':') as [InventorySort, SortDir];
                        onChange({ sort, dir });
                    }}
                >
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>
            {active && (
                <button
                    type="button"
                    className="btn btn-ghost btn-sm filters-clear"
                    onClick={() => {
                        onSearchChange('');
                        onChange({ category: null, location: null, q: '' });
                    }}
                >
                    Clear filters
                </button>
            )}
        </div>
    );
};

export default InventoryFilters;
