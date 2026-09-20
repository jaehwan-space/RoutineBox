import type { Category } from "@routinebox/shared";

const PATHS: Record<Category, string> = {
  DETERGENT: "M7 3h10l1 4H6l1-4Zm-1 4h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Zm3 5h6",
  TISSUE: "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8Zm4 0h8M8 12h8M8 16h5",
  WATER: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z",
  COFFEE: "M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 2h2a2 2 0 0 1 0 4h-2M6 3v2M10 3v2M14 3v2",
  KITCHEN: "M6 3v18M4 3v6a2 2 0 0 0 4 0V3M15 3c-2 0-3 2-3 5v3h3v10",
  PET: "M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 21c3 0 6-2 6-5 0-2-3-5-6-5s-6 3-6 5c0 3 3 5 6 5Z",
};

/** 카테고리 선 아이콘 (currentColor) */
export function CategoryIcon({ category, size = 28 }: { category: Category; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[category]} />
    </svg>
  );
}
