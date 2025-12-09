export default function SkeletonCard() {
  return (
    <div className="bg-white p-3 rounded shadow-product flex flex-col gap-2 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-11/12" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}
