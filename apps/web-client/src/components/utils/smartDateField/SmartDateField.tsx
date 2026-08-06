import { useState, useEffect } from "react";
import { parseSmartDate } from "../../../utils/dates";

const SmartDateField = ({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) => {
        const [draft, setDraft] = useState(value);

        useEffect(() => { setDraft(value); }, [value]);

        const handleBlur = () => {
        const parsed = parseSmartDate(draft);
        setDraft(parsed);
        onChange(parsed);
    };

    return (
        <div>
            <label className="inventory-add-main-label" htmlFor={id}>{label}</label>
            <input
            id={id}
            className="additem-input-field"
            type="text"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleBlur}
            />
        </div>
    );
};
export default SmartDateField;