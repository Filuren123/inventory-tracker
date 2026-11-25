import { forwardRef, useEffect, useState } from 'react';
import { parseSmartDate } from '../../utils/dates';

interface Props {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
}

/** Date input that accepts shorthand (5, 0612, 270612) and expands it on blur. */
const SmartDateField = forwardRef<HTMLInputElement, Props>(({ id, label, value, onChange }, ref) => {
    const [draft, setDraft] = useState(value);

    useEffect(() => setDraft(value), [value]);

    const commit = () => {
        const parsed = parseSmartDate(draft.trim());
        setDraft(parsed);
        onChange(parsed);
    };

    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <input
                ref={ref}
                id={id}
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                autoComplete="off"
            />
            <span className="hint">Shorthand: 5 · 0612 · 270612</span>
        </div>
    );
});

export default SmartDateField;
