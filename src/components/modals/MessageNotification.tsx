interface MessageNotificationProps {
  authorName: string;
  message: string;
}

export function MessageNotification({ authorName, message }: MessageNotificationProps) {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-xl px-4">
      <div className="bg-cyan-600 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
        <div className="flex-shrink-0 bg-white rounded-full w-12 h-12 flex items-center justify-center">
          <span className="text-cyan-600 text-2xl font-bold">i</span>
        </div>
        <div className="flex-1 text-white">
          <p className="font-bold text-lg">
            Message from {authorName}:
          </p>
          <p className="text-base">{message}</p>
        </div>
      </div>
    </div>
  );
}
