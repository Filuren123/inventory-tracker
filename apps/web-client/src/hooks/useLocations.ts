import { useCallback, useEffect, useState } from 'react';
import { addLocation, getLocations } from '../api/locations';

const byName = (a: string, b: string) => a.localeCompare(b, 'sv');

/** Storage locations from the database, plus a way to create new ones. */
export function useLocations() {
    const [locations, setLocations] = useState<string[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        getLocations().then(
            (rows) => {
                setLocations(rows.map((r) => r.name));
                setLoaded(true);
            },
            () => setLoaded(true),
        );
    }, []);

    /** Creates the location and returns its stored name. Throws on API errors. */
    const create = useCallback(async (name: string) => {
        const created = await addLocation(name);
        setLocations((prev) => [...prev, created.name].sort(byName));
        return created.name;
    }, []);

    return { locations, loaded, create };
}
