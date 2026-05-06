'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore } from '@/store/useHabitStore';
import { useHabitsForDate } from '@/hooks/useHabits';
import { ActivityHeatmap } from './ActivityHeatmap';
import { Award, Flame, Target } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export function StatsView() {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const habits = useHabitsForDate(selectedDate);
  const logs = useHabitStore(useShallow((s) => s.logs));
  
  // High-level overview stats
  const stats = useMemo(() => {
    const totalStreaks = habits.reduce((sum, h) => sum + h.streak.current, 0);
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak.longest), 0);
    const avgConsistency = habits.length > 0 
      ? Math.round(habits.reduce((sum, h) => sum + h.streak.consistencyScore, 0) / habits.length) 
      : 0;

    return { totalStreaks, bestStreak, avgConsistency };
  }, [habits]);

  // 14-day Trend Data for Line Chart
  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let completedCount = 0;
      logs.forEach(log => {
        if (log.date === dateStr && (log.status === 'completed' || (log.count && log.count > 0))) {
          completedCount++;
        }
      });
      
      data.push({
        date: displayDate,
        fullDate: dateStr,
        completed: completedCount
      });
    }
    return data;
  }, [logs]);

  // Category Distribution for Donut Chart
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    const colors: Record<string, string> = {};
    
    habits.forEach(h => {
      counts[h.category] = (counts[h.category] || 0) + 1;
      // Just pick the color of the first habit in this category to represent it
      if (!colors[h.category]) {
        colors[h.category] = h.color;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
      color: colors[key]
    })).sort((a, b) => b.value - a.value);
  }, [habits]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<Record<string, unknown>>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-foreground/10 rounded-xl p-3 shadow-xl">
          <p className="text-foreground/60 text-xs mb-1">{label}</p>
          <p className="text-accent font-bold text-lg">
            {String(payload[0].value)} <span className="text-sm font-normal text-foreground/80">habits completed</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-8 lg:pb-4 main-scroll-container">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
      </div>

      {/* Clean Overview Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-foreground/5 border border-foreground/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Target className="w-5 h-5 text-accent mb-2" />
          <span className="text-2xl font-bold text-foreground">{habits.length}</span>
          <span className="text-[0.65rem] text-foreground/40 uppercase tracking-wider mt-1">Active</span>
        </div>
        <div className="bg-foreground/5 border border-foreground/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Award className="w-5 h-5 text-success mb-2" />
          <span className="text-2xl font-bold text-success">{stats.avgConsistency}%</span>
          <span className="text-[0.65rem] text-foreground/40 uppercase tracking-wider mt-1">Consistency</span>
        </div>
        <div className="bg-foreground/5 border border-foreground/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Flame className="w-5 h-5 text-warning mb-2" />
          <span className="text-2xl font-bold text-warning">{stats.bestStreak}</span>
          <span className="text-[0.65rem] text-foreground/40 uppercase tracking-wider mt-1">Best Streak</span>
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <div className="bento-card p-5">
        <h3 className="text-sm font-semibold text-foreground/80 mb-6">Completion Trend (14 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground)" strokeOpacity={0.1} vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--foreground)"
                strokeOpacity={0.3}
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={{ fill: 'var(--foreground)', opacity: 0.6 }}
              />
              <YAxis 
                stroke="var(--foreground)"
                strokeOpacity={0.3}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: 'var(--foreground)', opacity: 0.6 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--foreground)', strokeOpacity: 0.1, strokeWidth: 2 }} />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="var(--accent)" 
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--background)', stroke: 'var(--accent)', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--foreground)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Donut Chart */}
      {categoryData.length > 0 && (
        <div className="bento-card p-5">
          <h3 className="text-sm font-semibold text-foreground/80 mb-2">Focus Areas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: 'var(--foreground)', opacity: 0.6 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Activity Heatmap (Refined spacing) */}
      <div className="bento-card p-5">
        <h3 className="text-sm font-semibold text-foreground/80 mb-4">Consistency Heatmap</h3>
        <div className="overflow-hidden">
          <ActivityHeatmap />
        </div>
      </div>
      
    </div>
  );
}
