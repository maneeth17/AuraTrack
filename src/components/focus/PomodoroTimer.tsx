'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function PomodoroTimer({ habitId, habitTitle, habitColor, onComplete, onClose }: PomodoroTimerProps) {
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [endTime, setEndTime] = useState<number | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`pomodoro-${habitId}`);
    if (saved) {
      const { endTime: savedEnd, phase: savedPhase, sessions } = JSON.parse(saved);
      const remaining = Math.max(0, Math.ceil((savedEnd - Date.now()) / 1000));
      if (remaining > 0) {
        setEndTime(savedEnd);
        setPhase(savedPhase);
        setTimeLeft(remaining);
        setSessionsCompleted(sessions);
        setIsRunning(true);
      }
    }
  }, [habitId]);

  const handlePhaseComplete = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setIsRunning(false);
    setEndTime(null);

    if (phase === 'focus') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);

      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      if (newSessions % 4 === 0) {
        setPhase('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setPhase('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }

      if (newSessions >= 1) {
        onComplete();
      }
    } else {
      setPhase('focus');
      setTimeLeft(FOCUS_DURATION);
    }

    localStorage.removeItem(`pomodoro-${habitId}`);
  }, [phase, sessionsCompleted, habitId, onComplete]);

  useEffect(() => {
    if (endTime && isRunning) {
      tickRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          handlePhaseComplete();
        }
      }, 250);
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [endTime, isRunning, handlePhaseComplete]);

  const handleStart = () => {
    const end = Date.now() + (timeLeft * 1000);
    setEndTime(end);
    setIsRunning(true);
    localStorage.setItem(`pomodoro-${habitId}`, JSON.stringify({ endTime: end, phase, sessions: sessionsCompleted }));
  };

  const handlePause = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    setIsRunning(false);
    setEndTime(null);
    localStorage.setItem(`pomodoro-${habitId}`, JSON.stringify({ endTime: null, phase, sessions: sessionsCompleted, timeLeft }));
  };

  const handleCancel = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    setIsRunning(false);
    setEndTime(null);
    setTimeLeft(phase === 'focus' ? FOCUS_DURATION : phase === 'shortBreak' ? SHORT_BREAK : LONG_BREAK);
    localStorage.removeItem(`pomodoro-${habitId}`);
    onClose();
  };

  const handleReset = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    setIsRunning(false);
    setEndTime(null);
    setTimeLeft(FOCUS_DURATION);
    setPhase('focus');
    setSessionsCompleted(0);
    localStorage.removeItem(`pomodoro-${habitId}`);
  };

  const progress = phase === 'focus' ? ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100 : phase === 'shortBreak' ? ((SHORT_BREAK - timeLeft) / SHORT_BREAK) * 100 : ((LONG_BREAK - timeLeft) / LONG_BREAK) * 100;

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass rounded-3xl border border-white/10 p-8 w-full max-w-sm shadow-2xl relative"
      >
        <button onClick={handleCancel} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-4 h-4 text-white/60" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-3">
            <Timer className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">Focus Session</span>
          </div>
          <h3 className="text-lg font-bold text-white">{habitTitle}</h3>
          <p className="text-xs text-white/40 mt-1">
            {phase === 'focus' ? 'Stay focused for 25 minutes' : phase === 'shortBreak' ? 'Take a 5 minute break' : 'Take a 15 minute break'}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={habitColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-white/40 mt-1 capitalize">{phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break'}</span>
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

        {sessionsCompleted > 0 && (
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ backgroundColor: i < (sessionsCompleted % 4) ? habitColor : 'rgba(255,255,255,0.1)' }}
              />
            ))}
            <span className="text-xs text-white/30 ml-2">{sessionsCompleted} sessions</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
