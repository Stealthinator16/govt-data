import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare States",
  description:
    "Compare two Indian states side-by-side across all 27 categories with radar charts and score breakdowns.",
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
