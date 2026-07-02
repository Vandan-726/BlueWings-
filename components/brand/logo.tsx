export function BlueWingsLogo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="text-primary"
      >
        <path
          d="M28 6L4 15.5l7.5 3L14 26l4.5-6 6.5 2L28 6z"
          fill="currentColor"
        />
        <path d="M11.5 18.5L28 6l-14 12.5v4L16.5 19" fill="#e00b41" />
      </svg>
      <span className="text-xl font-bold tracking-tight text-primary">
        bluewings
      </span>
    </span>
  )
}
