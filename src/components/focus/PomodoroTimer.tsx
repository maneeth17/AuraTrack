'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Timer, X } from 'lucide-react';

interface PomodoroTimerProps {
  habitId: string;
  habitTitle: string;
  habitColor: string;
  onComplete: () => void;
  onClose: () => void;
}

const FOCUS_DURATION = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

const PHASE_DURATION: Record<TimerPhase, number> = {
  focus: FOCUS_DURATION,
  shortBreak: SHORT_BREAK,
  longBreak: LONG_BREAK,
};

const PHASE_LABELS: Record<TimerPhase, string> = {
  focus: 'Stay focused for 25 minutes',
  shortBreak: 'Take a 5 minute break',
  longBreak: 'Take a 15 minute break',
};

const PHASE_SHORT_LABELS: Record<TimerPhase, string> = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const PomodoroTimerAtomic = memo(function PomodoroTimer({ habitId, habitTitle, habitColor, onComplete, onClose }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeTextRef = useRef<HTMLSpanElement | null>(null);
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const phaseRef = useRef<TimerPhase>('focus');

  const timeLeftRef = useRef(FOCUS_DURATION);
  const endTimeRef = useRef<number | null>(null);
  const sessionsRef = useRef(0);
  const circumference = useMemo(() => 2 * Math.PI * 54, []);
  
  const phaseTextRef = useRef<HTMLParagraphElement | null>(null);
  const sessionsContainerRef = useRef<HTMLDivElement | null>(null);

  const paintTime = useCallback((seconds: number, activePhase = phaseRef.current) => {
    timeLeftRef.current = seconds;

    if (timeTextRef.current) {
      timeTextRef.current.textContent = formatTime(seconds);
    }

    if (progressCircleRef.current) {
      const totalTime = PHASE_DURATION[activePhase];
      const pct = totalTime > 0 ? (totalTime - seconds) / totalTime : 0;
      progressCircleRef.current.style.strokeDashoffset = String(
        circumference - pct * circumference
      );
    }
  }, [circumference]);

  const paintPhaseUI = useCallback((activePhase: TimerPhase, sessions: number) => {
    if (phaseTextRef.current) {
      phaseTextRef.current.textContent = PHASE_LABELS[activePhase];
    }
    if (sessionsContainerRef.current) {
      const dots = Array.from({ length: 4 }).map((_, i) => {
        const isActive = i < (sessions % 4);
        return `<div class="w-2 h-2 rounded-full" style="background-color: ${isActive ? habitColor : 'rgba(255,255,255,0.1)'}"></div>`;
      }).join('');
      sessionsContainerRef.current.innerHTML = `
        <div class="flex items-center justify-center gap-1.5">${dots}<span class="text-xs text-white/30 ml-2">${sessions} sessions</span></div>
      `;
    }
  }, [habitColor]);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`pomodoro-${habitId}`);
    if (saved) {
      try {
        const { endTime: savedEnd, phase: savedPhase, sessions, timeLeft: savedTimeLeft } = JSON.parse(saved);
        const restoredPhase = (savedPhase || 'focus') as TimerPhase;
        phaseRef.current = restoredPhase;
        sessionsRef.current = sessions || 0;

        if (savedEnd && typeof savedEnd === 'number') {
          const remaining = Math.max(0, Math.ceil((savedEnd - Date.now()) / 1000));
          if (remaining > 0) {
            endTimeRef.current = savedEnd;
            paintTime(remaining, restoredPhase);
            paintPhaseUI(restoredPhase, sessionsRef.current);
            setIsRunning(true);
          } else {
            localStorage.removeItem(`pomodoro-${habitId}`);
            paintTime(PHASE_DURATION[restoredPhase], restoredPhase);
            paintPhaseUI(restoredPhase, sessionsRef.current);
          }
        } else if (typeof savedTimeLeft === 'number') {
          paintTime(savedTimeLeft, restoredPhase);
          paintPhaseUI(restoredPhase, sessionsRef.current);
        } else {
          paintTime(PHASE_DURATION[restoredPhase], restoredPhase);
          paintPhaseUI(restoredPhase, sessionsRef.current);
        }
      } catch {
        localStorage.removeItem(`pomodoro-${habitId}`);
        paintTime(FOCUS_DURATION, 'focus');
        paintPhaseUI('focus', 0);
      }
    } else {
      paintTime(FOCUS_DURATION, 'focus');
      paintPhaseUI('focus', 0);
    }
  }, [habitId, paintTime, paintPhaseUI]);

  const handlePhaseComplete = useCallback(() => {
    clearTick();
    setIsRunning(false);
    endTimeRef.current = null;

    if (phaseRef.current === 'focus') {
      const newSessions = sessionsRef.current + 1;
      sessionsRef.current = newSessions;

      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      if (newSessions % 4 === 0) {
        phaseRef.current = 'longBreak';
        paintTime(LONG_BREAK, 'longBreak');
        paintPhaseUI('longBreak', newSessions);
      } else {
        phaseRef.current = 'shortBreak';
        paintTime(SHORT_BREAK, 'shortBreak');
        paintPhaseUI('shortBreak', newSessions);
      }

      if (newSessions >= 1) {
        onComplete();
      }
    } else {
      phaseRef.current = 'focus';
      paintTime(FOCUS_DURATION, 'focus');
      paintPhaseUI('focus', sessionsRef.current);
    }

    localStorage.removeItem(`pomodoro-${habitId}`);
  }, [clearTick, habitId, onComplete, paintTime, paintPhaseUI]);

  useEffect(() => {
    if (!isRunning || !endTimeRef.current) return;

    const updateTime = () => {
      const endTime = endTimeRef.current;
      if (!endTime) return;

      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      paintTime(remaining);

      if (remaining === 0) {
        handlePhaseComplete();
      }
    };

    updateTime();
    tickRef.current = setInterval(updateTime, 1000);

    return clearTick;
  }, [clearTick, handlePhaseComplete, isRunning, paintTime]);

  const handleStart = () => {
    const end = Date.now() + (timeLeftRef.current * 1000);
    endTimeRef.current = end;
    setIsRunning(true);
    localStorage.setItem(`pomodoro-${habitId}`, JSON.stringify({ endTime: end, phase: phaseRef.current, sessions: sessionsRef.current }));
  };

  const handlePause = () => {
    clearTick();
    if (endTimeRef.current) {
      paintTime(Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000)));
    }
    setIsRunning(false);
    endTimeRef.current = null;
    localStorage.setItem(`pomodoro-${habitId}`, JSON.stringify({ endTime: null, phase: phaseRef.current, sessions: sessionsRef.current, timeLeft: timeLeftRef.current }));
  };

  const handleCancel = () => {
    clearTick();
    setIsRunning(false);
    endTimeRef.current = null;
    paintTime(PHASE_DURATION[phaseRef.current]);
    paintPhaseUI(phaseRef.current, sessionsRef.current);
    localStorage.removeItem(`pomodoro-${habitId}`);
    onClose();
  };

  const handleReset = () => {
    clearTick();
    setIsRunning(false);
    endTimeRef.current = null;
    phaseRef.current = 'focus';
    sessionsRef.current = 0;
    paintTime(FOCUS_DURATION, 'focus');
    paintPhaseUI('focus', 0);
    localStorage.removeItem(`pomodoro-${habitId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass glass-card rounded-3xl border border-white/10 p-8 w-full max-w-sm shadow-2xl relative gpu-accelerated"
      >
        <button onClick={handleCancel} className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white/60" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-3">
            <Timer className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">Focus Session</span>
          </div>
          <h3 className="text-lg font-bold text-white">{habitTitle}</h3>
          <p ref={phaseTextRef} className="text-xs text-white/40 mt-1">
            {PHASE_LABELS[phaseRef.current]}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle
                ref={progressCircleRef}
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={habitColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: circumference, transition: 'stroke-dashoffset 500ms linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span ref={timeTextRef} className="text-4xl font-bold text-white font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(FOCUS_DURATION)}
              </span>
              <span className="text-xs text-white/40 mt-1 capitalize">{PHASE_SHORT_LABELS[phaseRef.current]}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Square className="w-5 h-5 text-white/40" />
          </button>

          <button
            onClick={isRunning ? handlePause : handleStart}
            className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${habitColor}20`, border: `1px solid ${habitColor}40` }}
          >
            {isRunning ? (
              <Pause className="w-6 h-6" style={{ color: habitColor }} />
            ) : (
              <Play className="w-6 h-6 ml-1" style={{ color: habitColor }} />
            )}
          </button>

          <button
            onClick={handleCancel}
            className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Square className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div ref={sessionsContainerRef} className="mt-6" />
      </motion.div>
    </div>
  );
});

export { PomodoroTimerAtomic as PomodoroTimer };
