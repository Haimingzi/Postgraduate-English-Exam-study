"use client";

export function ReadingSkeleton() {
  return (
    <div className="font-serif text-lg leading-relaxed space-y-3">
      <div className="flex flex-col gap-2">
        {[85, 92, 78, 60].map((width, i) => (
          <div
            key={i}
            className="h-5 rounded bg-gray-200/80 overflow-hidden"
            style={{ width: `${width}%` }}
          >
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent bg-[length:200%_100%]" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-8 w-16 rounded-lg bg-gray-200/80 animate-pulse" />
        <div className="h-8 w-20 rounded-lg bg-gray-200/80 animate-pulse" />
      </div>
    </div>
  );
}
