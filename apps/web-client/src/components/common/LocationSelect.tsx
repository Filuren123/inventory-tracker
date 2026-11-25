import { useState, type KeyboardEvent } from 'react';
import { errorMessage } from '../../api/axios';

const NEW = '__new__';

interface Props {
    id: string;
    locations: string[];
    value: string;
    onChange: (value: string) => void;
    /** Creates a location and resolves to its stored name. */
    onCreate: (name: string) => Promise<string>;
    /** Label of the empty option, e.g. "Choose location…" or "None". */
    emptyLabel: string;
}

/** Dropdown of storage locations from the database, with "New location…" inline. */
const LocationSelect = ({ id, locations, value, onChange, onCreate, emptyLabel }: Props) => {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cancel = () => {
        setAdding(false);
        setName('');
        setError(null);
    };

    const create = async () => {
        if (!name.trim()) return;
        setBusy(true);
        setError(null);
        try {
            onChange(await onCreate(name.trim()));
            cancel();
        } catch (err) {
            setError(errorMessage(err, 'Could not create location'));
        } finally {
            setBusy(false);
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // don't submit the surrounding form
            create();
        }
        if (e.key === 'Escape') cancel();
    };

    if (adding) {
        return (
            <div className="location-new">
                <div className="location-new-row">
                    <input
                        id={id}
                        className="input"
                        placeholder="New location name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={onKeyDown}
                        autoFocus
                        autoComplete="off"
                    />
                    <button type="button" className="btn btn-primary" onClick={create} disabled={busy || !name.trim()}>
                        Add
                    </button>
                    <button type="button" className="btn" onClick={cancel}>
                        Cancel
                    </button>
                </div>
                {error && <span className="field-error">{error}</span>}
            </div>
        );
    }

    return (
        <select
            id={id}
            className="select"
            value={locations.includes(value) ? value : ''}
            onChange={(e) => (e.target.value === NEW ? setAdding(true) : onChange(e.target.value))}
        >
            <option value="">{emptyLabel}</option>
            {locations.map((l) => (
                <option key={l} value={l}>
                    {l}
                </option>
            ))}
            <option value={NEW}>+ New location…</option>
        </select>
    );
};

export default LocationSelect;
