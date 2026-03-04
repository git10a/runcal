"use client";

import { useState, useEffect } from 'react';

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load favorites from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('rankaru_favorites');
        if (stored) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFavorites(JSON.parse(stored));
            } catch {
                console.error('Failed to parse favorites from local storage');
            }
        }
        setIsLoaded(true);
    }, []);

    // Save favorites to local storage whenever they change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('rankaru_favorites', JSON.stringify(favorites));
        }
    }, [favorites, isLoaded]);

    const toggleFavorite = (id: string) => {
        setFavorites(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

    const isFavorite = (id: string) => favorites.includes(id);

    return { favorites, toggleFavorite, isFavorite, isLoaded };
}
