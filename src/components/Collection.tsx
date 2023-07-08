import { useStore } from "@nanostores/react";
import type { CollectionEntry } from "astro:content";
import { $filterTag, FilterTag } from "../stores/collection";
import { cn } from "../utils";
import { CollectionCard } from "./CollectionCard";
import Counter from "./Counter";
import { Masonry } from "./Masonry";

type BlogProps = CollectionEntry<"blog">;
type ProjectProps = CollectionEntry<"project">;
type PhotoProps = CollectionEntry<"photo">;
type Collection = (BlogProps | ProjectProps | PhotoProps)[];

const filters: FilterTag[] = ["all", "blog", "project", "photography"];

type CollectionProps = {
  blog: BlogProps[];
  project: ProjectProps[];
  photography: PhotoProps[];
};

export function Collection({ blog, project, photography }: CollectionProps) {
  const filterTag = useStore($filterTag);

  const items: Collection = ([] as unknown as Collection)
    .concat(project, blog, photography)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
    .filter((item) => {
      switch (filterTag) {
        case "project":
          return item.data.tag.toLowerCase() === filterTag;
        case "blog":
          return item.data.tag.toLowerCase() === filterTag;
        case "photography":
          return item.data.tag.toLowerCase() === filterTag;
        case "all":
        default:
          return true;
      }
    });
  const itemsCount = items.length;

  return (
    <>
      <div className="grid grid-cols-8 gap-10 sm:grid-cols-4">
        <ul className="col-span-4 flex gap-10 items-center sm:justify-between sm:overflow-x-scroll md:overflow-x-scroll">
          {filters.map((filter) => (
            <li key={filter}>
              <button
                className={cn(
                  "rounded-sm font-ibmMono py-2 px-4 hover:bg-gray-100 transition-all border border-white",
                  "dark:bg-gray-950 hover:dark:bg-gray-900 dark:border-gray-950 uppercase",
                  {
                    ["border-gray-300 dark:border-gray-800"]:
                      filter === filterTag,
                    ["hover:border-green-600 dark:hover:border-green-600"]:
                      filter === "blog",
                    ["hover:border-blue-600 dark:hover:border-blue-600"]:
                      filter === "project",
                    ["hover:border-yellow-500 dark:hover:border-yellow-500"]:
                      filter === "photography",
                  }
                )}
                onClick={() => $filterTag.set(filter)}
              >
                {filter}
              </button>
            </li>
          ))}
        </ul>
        <div className="col-span-4 flex justify-end sm:hidden">
          <Counter value={itemsCount} />
        </div>
      </div>
      <Masonry breakpoints={{ 1440: 4, 960: 2, 520: 1 }}>
        {items.map((post, i) => {
          return <CollectionCard key={i} post={post} />;
        })}
      </Masonry>
    </>
  );
}
