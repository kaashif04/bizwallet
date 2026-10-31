"use client";

import { useEffect } from "react";
import { rememberPlace } from "@/lib/place";

export default function RememberPlace({ outletId }: { outletId: string }) {
  useEffect(() => rememberPlace(outletId), [outletId]);
  return null;
}
