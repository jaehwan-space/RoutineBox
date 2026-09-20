import type { Category } from "@routinebox/shared";

const PATHS: Record<Category, string> = {
  SALAD_MEAL: "M4 14h16l-1.5 5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 14Zm2-3c1-4 4-6 6-6s5 2 6 6M9 8c0-2 1-3 3-3",
  FRUIT_NUT_RICE: "M12 8c-4 0-7 3-7 7s3 6 7 6 7-2 7-6-3-7-7-7Zm0 0V4m0 0c1.5 0 3 1 4 2M12 4c-1.5 0-3 1-4 2",
  SOUP_SIDE_MAIN: "M4 11h16a8 8 0 0 1-16 0Zm-1 0h18M8 7c0-1.5 1-2 1-3m3 3c0-1.5 1-2 1-3",
  MEAT_EGG: "M8 20c-3 0-5-3-5-6 0-4 3-10 5-10s5 6 5 10c0 3-2 6-5 6Zm8-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  BAKERY_CHEESE_DELI: "M3 13l9-7 9 7v6H3v-6Zm4 3h2m4 0h2M12 6V4",
  SEAFOOD: "M3 12s4-6 10-6 8 6 8 6-2 6-8 6-10-6-10-6Zm12 0h.01M3 12l-1-4m1 4l-1 4",
  SNACK: "M6 4h12v6a6 6 0 0 1-12 0V4Zm3 12h6l-1 4h-4l-1-4Zm0-9h2m4 0h2",
  HEALTH: "M12 3v18M3 12h18M7.5 7.5l9 9m0-9l-9 9",
  WATER: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z",
  COFFEE: "M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 2h2a2 2 0 0 1 0 4h-2M6 3v2M10 3v2M14 3v2",
  DETERGENT: "M7 3h10l1 4H6l1-4Zm-1 4h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Zm3 5h6",
  TISSUE: "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8Zm4 0h8M8 12h8M8 16h5",
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
