// The order pad's pieces. A Chit is a slip torn off the restaurant's pad; its
// band is the pink carbon copy's header; Stamp marks state (PAID, READY...).

export function Chit({
  band,
  children,
  className = "",
  as: Tag = "section",
}: {
  band?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={`chit ${className}`}>
      <div className="chit-paper overflow-hidden">
        {band && <div className="chit-band px-4 pb-2.5 pt-4">{band}</div>}
        {children}
      </div>
    </Tag>
  );
}

export function Stamp({
  children,
  ok = false,
  thump = false,
  className = "",
}: {
  children: React.ReactNode;
  ok?: boolean; // green: done and good (READY, COLLECTED); red: PAID, NEW, stops
  thump?: boolean; // the stamp coming down: only when the state just changed
  className?: string;
}) {
  return <span className={`stamp text-xs ${ok ? "stamp-ok" : ""} ${thump ? "stamp-thump" : ""} ${className}`}>{children}</span>;
}

// Label over a value, printed like the pad's column heads.
export function PadLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`pad-label text-brand-700 ${className}`}>{children}</span>;
}
