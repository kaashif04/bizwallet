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

export function PlusIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CupIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 8h10l-.8 11.2a2 2 0 0 1-2 1.8H9.8a2 2 0 0 1-2-1.8L7 8Z" />
      <path d="M6 8h12" />
      <path d="M9.5 4.5c.5.7.5 1.5 0 2.2M12 4.3c.5.7.5 1.5 0 2.2M14.5 4.5c.5.7.5 1.5 0 2.2" />
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

export function TicketIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a3 3 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      <path d="M15 5.5v13" />
    </Svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.25 12 11.2 3.05a1.125 1.125 0 0 1 1.59 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    </Svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12A1.125 1.125 0 0 1 19.745 21H4.255a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </Svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9v3" />
    </Svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0A17.9 17.9 0 0 1 12 21.75c-2.676 0-5.216-.584-7.5-1.632Z" />
    </Svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15 19.128a9.4 9.4 0 0 0 2.625.372 9.3 9.3 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.3 12.3 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </Svg>
  );
}

export function MegaphoneIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10.34 15.84c-.688-.06-1.386-.123-2.07-.196a17.3 17.3 0 0 1-2.484-.398M10.34 15.84c.05.66.146 1.319.286 1.965A1.69 1.69 0 0 1 8.93 19.9h-.348a1.85 1.85 0 0 1-1.815-1.494 19 19 0 0 1-.296-2.135M10.34 15.84a23.8 23.8 0 0 1-4.852-.594m4.852.594V8.27m4.5 5.834c1.503-.121 2.946-.353 4.314-.689a18.7 18.7 0 0 0 0-9.272c-1.368-.336-2.811-.568-4.314-.689m0 10.65a3.75 3.75 0 0 1-4.852-.594m4.852.594V3.43m0 10.65v-10.65m0 0c1.5-.121 2.94-.353 4.3-.689" />
    </Svg>
  );
}
