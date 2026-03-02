import { Suspense } from 'react';
import { getAllRaces, getUniquePrefectures, getUniqueDistances } from '@/lib/data';
import RaceList from '@/components/RaceList';

export default function Home() {
  const races = getAllRaces();
  const prefectures = getUniquePrefectures();
  const distances = getUniqueDistances();

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="bg-background pt-10 pb-6">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            走りたいマラソン大会が<br className="md:hidden" /><span className="text-primary tracking-normal">すぐ</span>に見つかる
          </h1>
        </div>
      </section>

      {/* Main Content (Filter + List) */}
      <div className="flex-1 pb-20">
        <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
          <RaceList
            initialRaces={races}
            prefectures={prefectures}
            distances={distances}
          />
        </Suspense>
      </div>
    </div>
  );
}
