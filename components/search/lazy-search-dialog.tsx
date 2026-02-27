"use client";

import dynamic from "next/dynamic";

const SearchDialog = dynamic(
  () =>
    import("@/components/search/search-dialog").then(
      (mod) => mod.SearchDialog
    ),
  { ssr: false }
);

export function LazySearchDialog() {
  return <SearchDialog />;
}
