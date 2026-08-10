export default function Loading({ size = 'md', text = 'در حال بارگذاری...' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      {text && <p className="text-gray-600">{text}</p>}
    </div>
  )
}

export function LoadingSpinner({ size = 'sm', className = '' }) {
  const sizes = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-10 h-10 border-4',
  }

  return (
    <div className={`${sizes[size]} border-gray-200 border-t-primary-600 rounded-full animate-spin ${className}`}></div>
  )
}
