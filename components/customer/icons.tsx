// Lightweight line-icon set (heroicons-style) used across the customer app.
// Each takes a `className` so size/colour come from Tailwind.

function Svg({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export function BellIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14.857 17.082a24 24 0 0 0 5.454-1.31A8.97 8.97 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.97 8.97 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24 24 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </Svg>
  );
}

export function ReceiptIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7.5 3.75h9a.75.75 0 0 1 .75.75v15.2a.4.4 0 0 1-.6.34l-1.9-1.1-1.95 1.13a.4.4 0 0 1-.4 0L10.5 18.94l-1.95 1.13a.4.4 0 0 1-.6-.35V4.5a.75.75 0 0 1 .75-.75H7.5Z" />
      <path d="M9.75 8.25h4.5M9.75 11.5h4.5" />
    </Svg>
  );
}
