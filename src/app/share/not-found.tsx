export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <p className="text-xl text-white/60 mb-8">This habit journey doesn&apos;t exist</p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
        >
          Go to AuraTrack
        </a>
      </div>
    </div>
  );
}
