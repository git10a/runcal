import { Race } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';

export function useRaceFilters(initialRaces: Race[]) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const selectedPrefecture = searchParams.get('prefecture');
    const selectedDistance = searchParams.get('distance');
    const selectedMonth = searchParams.get('month');
    const showOnlyOpen = searchParams.get('open') === 'true';
    const showOnlyCertified = searchParams.get('certified') === 'true';

    const updateFilterParams = (key: string, value: string | null | boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || value === false || value === '') {
            params.delete(key);
        } else {
            params.set(key, String(value));
        }
        router.push(`?${params.toString()}`);
    };

    const handleFilterChange = (type: 'prefecture' | 'distance' | 'month' | 'onlyOpen' | 'onlyCertified', value: any) => {
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

    return {
        filteredRaces,
        selectedPrefecture,
        selectedDistance,
        selectedMonth,
        showOnlyOpen,
        showOnlyCertified,
        handleFilterChange,
        handleClearAll,
        currentQueryString: searchParams.toString()
    };
}
