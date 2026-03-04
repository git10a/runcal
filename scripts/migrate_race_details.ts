import fs from 'fs';
import path from 'path';

export function normalizeRaceName(name: string): string {
    return name
        .replace(/第\d+回(記念)?/g, '') // Remove "第N回" or "第N回記念"
        .replace(/20\d{2}/g, '') // Remove year like "2024" or "2025"
        .replace(/令和\d+年(度)?/g, '') // Remove Japanese era year
        .trim();
}

async function migrate() {
    console.log("Starting migration of race_details.json...");
    const racesJsonPath = path.resolve('./data/races.json');
    const detailsJsonPath = path.resolve('./data/race_details.json');
    
    if (!fs.existsSync(racesJsonPath) || !fs.existsSync(detailsJsonPath)) {
        console.error("Missing required data files.");
        return;
    }

    const racesData = JSON.parse(fs.readFileSync(racesJsonPath, 'utf-8'));
    const detailsData = JSON.parse(fs.readFileSync(detailsJsonPath, 'utf-8'));

    // Create a map of race.id to normalized name
    const idToNormalizedName: Record<string, string> = {};
    for (const race of racesData) {
        idToNormalizedName[race.id] = normalizeRaceName(race.name);
    }

    const migratedDetails: Record<string, any> = {};
    let migratedCount = 0;

    for (const [id, originalData] of Object.entries(detailsData)) {
        const normalizedKey = idToNormalizedName[id];
        if (normalizedKey) {
            // Check if it already exists to avoid overwriting accidentally, though shouldn't happen here
            if (!migratedDetails[normalizedKey]) {
                migratedDetails[normalizedKey] = originalData;
                migratedCount++;
                console.log(`Migrated: ${id} -> ${normalizedKey}`);
            } else {
                 console.log(`Duplicate found for normalized key: ${normalizedKey}, skipping id: ${id}`);
            }
        } else {
             console.log(`Warning: race id ${id} not found in races.json, keeping the old key.`);
             migratedDetails[id] = originalData;
        }
    }

    // Save the migrated data
    fs.writeFileSync(detailsJsonPath, JSON.stringify(migratedDetails, null, 2));
    console.log(`\nMigration complete! Total migrated records: ${migratedCount}`);
}

migrate();
