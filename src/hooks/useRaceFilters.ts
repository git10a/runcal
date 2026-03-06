import { Race } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPrefecturesByRegion } from '@/lib/data';

export function useRaceFilters(initialRaces: Race[]) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const selectedPrefecture = searchParams.get('prefecture');
    const selectedRegion = searchParams.get('region');
    const selectedDistance = searchParams.get('distance');
    const selectedMonth = searchParams.get('month');
    const selectedTags = searchParams.getAll('tags');
    const statusParam = searchParams.get('status');
    const selectedEntryStatus: import('@/types').EntryStatusValue | null =
        statusParam === null ? '受付中' : statusParam === 'all' ? null : statusParam as import('@/types').EntryStatusValue;
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

    const handleFilterChange = (type: 'prefecture' | 'region' | 'distance' | 'month' | 'entryStatus' | 'onlyCertified' | 'tags', value: string | string[] | boolean | null) => {
        switch (type) {
            case 'prefecture':
                updateFilterParams('prefecture', value);
                updateFilterParams('region', null);
                break;
            case 'region':
                updateFilterParams('region', value);
                updateFilterParams('prefecture', null);
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
            case 'entryStatus':
                updateFilterParams('status', value === null ? 'all' : value);
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
    if (selectedRegion) {
        const regionPrefs = getPrefecturesByRegion(selectedRegion);
        filteredRaces = filteredRaces.filter(r => regionPrefs.includes(r.prefecture));
    } else if (selectedPrefecture) {
        filteredRaces = filteredRaces.filter(r => r.prefecture === selectedPrefecture);
    }
    if (selectedDistance) {
        filteredRaces = filteredRaces.filter(r => r.distance.includes(selectedDistance));
    }
    if (selectedEntryStatus) {
        filteredRaces = filteredRaces.filter(r => r.entry_status === selectedEntryStatus);
    }
    if (showOnlyCertified) {
        filteredRaces = filteredRaces.filter(r => r.is_jaaf_certified === true);
    }
    if (selectedTags.length > 0) {
        filteredRaces = filteredRaces.filter(r =>
            selectedTags.every(tag => r.tags && r.tags.includes(tag))
        );
    }

    filteredRaces = filteredRaces.sort((a, b) => a.date.localeCompare(b.date));

    return {
        filteredRaces,
        selectedPrefecture,
        selectedRegion,
        selectedDistance,
        selectedMonth,
        selectedTags,
        selectedEntryStatus,
        showOnlyCertified,
        handleFilterChange,
        handleClearAll,
        currentQueryString: searchParams.toString()
    };
}
