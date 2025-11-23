export function CopyNotification() {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md px-4">
      <div className="bg-cyan-600 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
        <div className="flex-shrink-0 bg-white rounded-full w-12 h-12 flex items-center justify-center">
          <span className="text-cyan-600 text-2xl font-bold">i</span>
        </div>
        <p className="flex-1 text-white font-bold text-lg">
          Copied to clipboard.
        </p>
      </div>
    </div>
  );
}
