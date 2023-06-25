import { useStore } from "@nanostores/react";
import { CollectionEntry, getCollection } from "astro:content";
import { $filterTag, FilterTag } from "../stores/collection";
import { cn } from "../utils";
import { CollectionCard } from "./CollectionCard";
import { Masonry } from "./Masonry";

type BlogProps = CollectionEntry<"blog">;
type ProjectProps = CollectionEntry<"project">;
type Collection = (BlogProps | ProjectProps)[];

const blog = await getCollection("blog");
const project = await getCollection("project");

const filters: FilterTag[] = ["all", "blog", "project"];

export function Collection() {
  const filterTag = useStore($filterTag);

  const items: Collection = ([] as unknown as Collection)
    .concat(project, blog)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
    .filter((item) => {
      switch (filterTag) {
        case "project":
          return item.data.tag.toLowerCase() === filterTag;
        case "blog":
          return item.data.tag.toLowerCase() === filterTag;
        case "all":
        default:
          return true;
      }
    });
  const itemsCount = items.length;

  return (
    <>
      <div className="grid grid-cols-8 gap-10">
        <ul className="col-span-4 flex gap-10 items-center">
          {filters.map((filter) => (
            <li key={filter}>
              <button
                className={cn(
                  "rounded-sm font-ibmMono py-2 px-4 hover:bg-gray-100 transition-all border border-white",
                  "dark:bg-gray-950 hover:dark:bg-gray-900 dark:border-gray-950",
                  {
                    ["border-gray-300 dark:border-gray-800"]:
                      filter === filterTag,
                  }
                )}
                onClick={() => $filterTag.set(filter)}
              >
                {filter.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
        <div className="col-span-4 flex justify-end">
          <div className="rounded-sm font-ibmMono tabular-nums py-2 px-4 border transition-all border-gray-300 dark:bg-gray-950 hover:dark:bg-gray-900 dark:border-gray-800">
            {String(itemsCount).padStart(3, "0")}
          </div>
        </div>
      </div>
      <Masonry breakpoints={{ 1440: 4, 960: 2, 520: 1 }}>
        {items.map((post) => {
          return <CollectionCard key={post.id} post={post} />;
        })}
      </Masonry>
    </>
  );
}
