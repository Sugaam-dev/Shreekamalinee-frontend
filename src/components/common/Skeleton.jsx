export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-charcoal/10 rounded-xs ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-line/60 rounded-sm overflow-hidden p-3 animate-pulse">
      <div className="aspect-[3/4] bg-charcoal/10 rounded-xs mb-3 w-full" />
      <div className="h-3 bg-charcoal/10 rounded-xs w-1/3 mb-2" />
      <div className="h-4 bg-charcoal/10 rounded-xs w-3/4 mb-2" />
      <div className="h-4 bg-charcoal/10 rounded-xs w-1/2 mt-auto" />
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-xs bg-charcoal/10 animate-pulse border border-line/60">
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-2">
        <div className="h-5 bg-white/40 rounded-xs w-2/3" />
        <div className="h-3 bg-white/30 rounded-xs w-1/3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse border-b border-line/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-charcoal/10 rounded-xs w-full" />
        </td>
      ))}
    </tr>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="p-6 bg-white border border-line rounded-sm shadow-xs animate-pulse space-y-3">
      <div className="h-3 bg-charcoal/10 rounded-xs w-1/3" />
      <div className="h-8 bg-charcoal/10 rounded-xs w-1/2" />
      <div className="h-3 bg-charcoal/10 rounded-xs w-2/3" />
    </div>
  );
}