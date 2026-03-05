export interface Race {
    id: string;
    name: string;
    date: string;
    entry_start_date: string | null;
    entry_end_date: string | null;
    entry_status?: string;
    prefecture: string;
    city: string | null;
    distance: string[];
    is_jaaf_certified: boolean;
    time_limit?: string;
    features?: string;
    tags?: string[];
    url: string;
    image_url?: string;
    updated_at: string;
    is_hot?: boolean;
}

export type FilterType = 'prefecture' | 'region' | 'distance' | 'month' | 'onlyOpen' | 'onlyCertified' | 'tags';
