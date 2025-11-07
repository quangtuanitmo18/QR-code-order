import { Skeleton } from '@/components/ui/skeleton'

export default function TableSkeleton() {
  return (
    <div className="w-full">
      {/* Tiêu đề của table */}
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-[20px] w-1/4 rounded-md" />
        <Skeleton className="h-[20px] w-1/4 rounded-md" />
        <Skeleton className="h-[20px] w-1/4 rounded-md" />
        <Skeleton className="h-[20px] w-1/4 rounded-md" />
      </div>
      {/* Mô phỏng các hàng trong table */}
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="mb-2 flex items-center justify-between">
          <Skeleton className="h-[20px] w-1/4 rounded-md" />
          <Skeleton className="h-[20px] w-1/4 rounded-md" />
          <Skeleton className="h-[20px] w-1/4 rounded-md" />
          <Skeleton className="h-[20px] w-1/4 rounded-md" />
        </div>
      ))}
    </div>
  )
}
