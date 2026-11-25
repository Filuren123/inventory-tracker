import { useMemo } from 'react';
import type { CategoryNode } from '../../utils/categoryTree';

interface Props {
    id: string;
    /** Flattened tree (depth-first) from useCategories().flat */
    options: CategoryNode[];
    value: number | null;
    onChange: (id: number | null) => void;
    emptyLabel: string;
    /** Ids that cannot be chosen (e.g. a category and its own subtree when moving it). */
    disabledIds?: Set<number>;
    className?: string;
    'aria-label'?: string;
}

/**
 * Native <select> (works well on touch devices). Options are in tree order and
 * labelled with their full path, e.g. "Kylvaror › Mejeri › Ost", so the closed
 * select shows an unambiguous name.
 */
const CategorySelect = ({ id, options, value, onChange, emptyLabel, disabledIds, className, ...rest }: Props) => {
    const labels = useMemo(() => {
        const byId = new Map(options.map((c) => [c.id, c]));
        const label = new Map<number, string>();
        for (const c of options) {
            const parent = c.parent_id != null ? byId.get(c.parent_id) : undefined;
            label.set(c.id, parent && label.has(parent.id) ? `${label.get(parent.id)} › ${c.name}` : c.name);
        }
        return label;
    }, [options]);

    return (
        <select
            id={id}
            className={`select ${className ?? ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            aria-label={rest['aria-label']}
        >
            <option value="">{emptyLabel}</option>
            {options.map((c) => (
                <option key={c.id} value={c.id} disabled={disabledIds?.has(c.id)}>
                    {labels.get(c.id)}
                </option>
            ))}
        </select>
    );
};

export default CategorySelect;
