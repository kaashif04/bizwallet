// The wallet's steamed-bun mascot and the animal avatars (art in public/mascot and public/avatars).
export type Pose = "base" | "scan" | "bye" | "waiting" | "ready" | "empty" | "trophy" | "points" | "oops" | "head";

export function Mascot({ pose, className = "h-32 w-32" }: { pose: Pose; className?: string }) {
  return <img src={`/mascot/${pose}.png`} alt="" decoding="async" draggable={false} className={`select-none object-contain ${className}`} />;
}

// One of 12 animals, always the same one for the same name.
export function Avatar({ name, className = "h-9 w-9" }: { name: string; className?: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const n = String((h % 12) + 1).padStart(2, "0");
  return <img src={`/avatars/${n}.png`} alt="" loading="lazy" decoding="async" draggable={false} className={`shrink-0 rounded-full ${className}`} />;
}
