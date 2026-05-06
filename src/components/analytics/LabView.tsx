'use client';

import { memo } from 'react';
import { usePatternAnalysis } from '@/hooks/usePatternAnalysis';
import { TrendingUp, Target, Calendar, Link2, Award, AlertCircle } from 'lucide-react';

function MiniBarChart({ data, color = '#818cf8' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 0.01);

  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${(value / max) * 100}%`,
            backgroundColor: color,
            opacity: 0.4 + (value / max) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export const LabView = memo(function LabView() {
  const analysis = usePatternAnalysis();

  if (analysis.totalDays === 0) {
    return (
      <div className="space-y-6 pb-8 lg:pb-4">
        <h2 className="text-2xl font-bold text-foreground">The Lab</h2>
        <div className="bento-card flex flex-col items-center justify-center py-16 text-center">
          <Target className="w-12 h-12 text-foreground/20 mb-4" />
          <p className="text-foreground/40 text-lg">Start tracking habits to unlock insights</p>
          <p className="text-foreground/30 text-sm mt-2">Complete your first habit today to see patterns emerge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 lg:pb-4">
      <h2 className="text-2xl font-bold text-foreground">The Lab</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bento-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-semibold text-foreground/80">Completion Rate</h3>
          </div>
          <p className="text-4xl font-bold text-foreground">{Math.round(analysis.completionRate * 100)}%</p>
          <p className="text-xs text-foreground/40 mt-1">Across {analysis.totalDays} days</p>
          <div className="mt-4">
            <MiniBarChart data={analysis.weeklyTrend} />
            <div className="flex justify-between mt-1">
              <span className="text-[0.6rem] text-foreground/20">8 weeks ago</span>
              <span className="text-[0.6rem] text-foreground/20">This week</span>
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground/80">Longest Streak</h3>
          </div>
          <p className="text-4xl font-bold text-amber-400">{analysis.longestStreak.streak}</p>
          <p className="text-xs text-foreground/40 mt-1">{analysis.longestStreak.habitTitle}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-xs text-foreground/40">Best Day</span>
              <span className="text-xs text-foreground/70 font-medium">{analysis.bestDay.day} ({Math.round(analysis.bestDay.rate * 100)}%)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-foreground/40">Most Consistent</span>
              <span className="text-xs text-foreground/70 font-medium">{analysis.mostConsistentHabit.habitTitle}</span>
            </div>
          </div>
        </div>
      </div>

      {analysis.habitPairs.length > 0 && (
        <div className="bento-card">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-foreground/80">Habit Coupling</h3>
          </div>
          <p className="text-xs text-foreground/40 mb-3">Habits you tend to complete together</p>
          <div className="space-y-3">
            {analysis.habitPairs.slice(0, 3).map((pair, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/80 truncate">
                    {pair.habitA} + {pair.habitB}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-purple-400">{Math.round(pair.correlation * 100)}%</p>
                  <p className="text-[0.6rem] text-foreground/30">{pair.coCompleted}/{pair.totalDays} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.habitsNeedingAttention.length > 0 && (
        <div className="bento-card border-orange-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-semibold text-foreground/80">Needs Attention</h3>
          </div>
          <div className="space-y-3">
            {analysis.habitsNeedingAttention.map((habit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/80 truncate">{habit.habitTitle}</p>
                  <p className="text-xs text-foreground/40">{Math.round(habit.rate * 100)}% completion rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.weekendSlump && (
        <div className="bento-card border-blue-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground/80">Weekend Slump Detected</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-500/5">
              <p className="text-sm text-foreground/70">
                Your completion rate drops on weekends. Weekday: {Math.round(analysis.weekendSlump.weekdayRate * 100)}% vs Weekend: {Math.round(analysis.weekendSlump.weekendRate * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis.chainReaction && analysis.chainReaction.length > 0 && (
        <div className="bento-card border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-foreground/80">Chain Reaction</h3>
          </div>
          <p className="text-xs text-foreground/40 mb-3">Missing these habits often leads to missing others</p>
          <div className="space-y-3">
            {analysis.chainReaction.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/80 truncate">{item.habitTitle}</p>
                  <p className="text-xs text-foreground/40">
                    When missed, you miss {item.avgOthersMissed.toFixed(1)} other habits
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.adviceCards && analysis.adviceCards.length > 0 && (
        <div className="bento-card border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground/80">AI Advice</h3>
          </div>
          <div className="space-y-3">
            {analysis.adviceCards.map((card, index) => (
              <div key={index} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{card.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/80 mb-1">{card.title}</p>
                    <p className="text-xs text-foreground/50">{card.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
