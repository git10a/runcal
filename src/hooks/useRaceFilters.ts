import { Race } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';

export function useRaceFilters(initialRaces: Race[]) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const selectedPrefecture = searchParams.get('prefecture');
    const selectedDistance = searchParams.get('distance');
    const selectedMonth = searchParams.get('month');
    const selectedTags = searchParams.getAll('tags');
    const openParam = searchParams.get('open');
    const showOnlyOpen = openParam === null ? true : openParam === 'true';
    const showOnlyCertified = searchParams.get('certified') === 'true';

    const updateFilterParams = (key: string, value: string | string[] | null | boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            params.delete(key);
        } else if (value === false) {
            params.set(key, 'false');
        } else if (Array.isArray(value)) {
            params.delete(key);
            value.forEach(v => params.append(key, v));
        } else {
            params.set(key, String(value));
        }
        router.push(`?${params.toString()}`);
    };

    const handleFilterChange = (type: 'prefecture' | 'distance' | 'month' | 'onlyOpen' | 'onlyCertified' | 'tags', value: string | string[] | boolean | null) => {
        switch (type) {
            case 'prefecture':
                updateFilterParams('prefecture', value);
                break;
            case 'distance':
                updateFilterParams('distance', value);
                break;
            case 'month':
                updateFilterParams('month', value);
                break;
            case 'tags':
                updateFilterParams('tags', value);
                break;
            case 'onlyOpen':
                updateFilterParams('open', value);
                break;
            case 'onlyCertified':
                updateFilterParams('certified', value);
                break;
        }
    };

    const handleClearAll = () => {
        router.push('?');
    };

    let filteredRaces = initialRaces;

    if (selectedMonth) {
        filteredRaces = filteredRaces.filter(r => r.date.startsWith(selectedMonth));
    }
    if (selectedPrefecture) {
        filteredRaces = filteredRaces.filter(r => r.prefecture === selectedPrefecture);
    }
    if (selectedDistance) {
        filteredRaces = filteredRaces.filter(r => r.distance.includes(selectedDistance));
    }
    if (showOnlyOpen) {
        filteredRaces = filteredRaces.filter(r => r.entry_status === '受付中');
    }
    if (showOnlyCertified) {
        filteredRaces = filteredRaces.filter(r => r.is_jaaf_certified === true);
    }
    if (selectedTags.length > 0) {
        // AND search logic: the race must have all selected tags
        filteredRaces = filteredRaces.filter(r =>
            selectedTags.every(tag => r.tags && r.tags.includes(tag))
        );
    }

    return {
        filteredRaces,
        selectedPrefecture,
        selectedDistance,
        selectedMonth,
        selectedTags,
        showOnlyOpen,
        showOnlyCertified,
        handleFilterChange,
        handleClearAll,
        currentQueryString: searchParams.toString()
    };
}
