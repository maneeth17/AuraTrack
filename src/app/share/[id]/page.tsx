import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';

interface ShareData {
  name: string;
  image: string | null;
  habits: Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    color: string;
    icon: string;
    completedDays: number;
    totalDays: number;
    currentStreak: number;
    createdAt: string;
  }>;
  totalHabits: number;
  totalCompletions: number;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/share?id=${params.id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return { title: 'AuraTrack — Habit Tracker' };
  }

  const data: ShareData = await res.json();

  return {
    title: `${data.name}'s Habit Journey — AuraTrack`,
    description: `Tracking ${data.totalHabits} habits with ${data.totalCompletions} completions.`,
  };
}

async function getShareData(id: string): Promise<ShareData | null> {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/share?id=${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const data = await getShareData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          {data.image && (
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-4 ring-2 ring-accent/20">
              <Image src={data.image} alt={data.name} width={80} height={80} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-3xl font-bold">{data.name}&apos;s Habit Journey</h1>
          <p className="text-white/40 mt-2">Building better habits, one day at a time</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-4xl font-bold text-accent">{data.totalHabits}</p>
            <p className="text-sm text-white/40 mt-1">Active Habits</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-4xl font-bold text-emerald-400">{data.totalCompletions}</p>
            <p className="text-sm text-white/40 mt-1">Total Completions</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white/60 uppercase tracking-wider text-sm">Current Habits</h2>
          {data.habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${habit.color}20` }}
                >
                  <span className="text-2xl">{habit.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
                  {habit.description && (
                    <p className="text-sm text-white/40 mt-0.5 line-clamp-1">{habit.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-xs text-white/50">{habit.currentStreak} day streak</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-white/50">{habit.completedDays}/{habit.totalDays} completed</span>
                    </div>
                  </div>
                </div>
                {habit.currentStreak > 0 && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-accent">{habit.currentStreak}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs text-white/20">
            Shared via{' '}
            <a href="https://auratrack.app" className="text-accent/60 hover:text-accent transition-colors">
              AuraTrack
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
