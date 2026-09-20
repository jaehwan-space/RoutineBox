"use client";

import { useEffect, useState } from "react";

/** 클라이언트에서만 평가되는 미디어 쿼리. SSR·첫 렌더는 false. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
