import type { PropsWithChildren } from "react";
import { useStore } from "@nanostores/react";
import type { CollectionEntry } from "astro:content";
import { Masonry } from "@/components/Masonry";
import type { FilterTag } from "../stores/collection";
import { $filterTag, $descriptionLang } from "../stores/collection";
import { CollectionCard } from "./CollectionCard";
import Counter from "./Counter";

function LangSwitcher() {
  const descLang = useStore($descriptionLang);
  return (
    <button
      className="bg-transparent border-none inline text-gray-500 hover:text-gray-900 transition-all dark:hover:text-gray-50"
      onClick={() => $descriptionLang.set(descLang === "id" ? "en" : "id")}
    >
      {descLang}
    </button>
  );
}

export default LangSwitcher;
