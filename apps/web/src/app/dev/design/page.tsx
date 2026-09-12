import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignGallery } from "@/design/gallery/DesignGallery";

export const metadata: Metadata = { title: "디자인 시스템", robots: { index: false } };

/** 개발 환경 전용 스타일 가이드. 운영 빌드에서는 404. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignGallery />;
}
