export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function DoctorCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}
