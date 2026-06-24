interface SkeletonProps {
  width?:   string;
  height?:  string;
  radius?:  string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', radius = '8px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-row">
        <Skeleton width="44px" height="44px" radius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width="60%" height="16px" />
          <Skeleton width="40%" height="13px" />
        </div>
        <Skeleton width="64px" height="20px" />
      </div>
      <Skeleton width="100%" height="1px" radius="0" />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton width="80px" height="28px" radius="20px" />
        <Skeleton width="60px" height="28px" radius="20px" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
