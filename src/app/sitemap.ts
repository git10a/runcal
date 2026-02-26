import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    // Fallback progression: Custom Env -> Vercel Prod -> Vercel Branch -> Localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL
        : process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000';

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/favorites`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];
}
