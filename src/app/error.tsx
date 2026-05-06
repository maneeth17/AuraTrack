'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-white/60">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-xl hover:bg-accent/30 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
