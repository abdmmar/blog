import type { PropsWithChildren } from "react";
import { useStore } from "@nanostores/react";
import type { CollectionEntry } from "astro:content";
import { Masonry } from "@/components/Masonry";
import type { FilterTag } from "../stores/collection";
import { $filterTag, $descriptionLang } from "../stores/collection";
import { CollectionCard } from "./CollectionCard";
import Counter from "./Counter";

type BlogProps = CollectionEntry<"blog">;
type ProjectProps = CollectionEntry<"project">;
type Collection = (BlogProps | ProjectProps)[];

const filters: Array<FilterTag> = ["All", "Blog", "Project"];

type CollectionProps = {
  blog: BlogProps[];
  project: ProjectProps[];
};

function Sup({ children }: PropsWithChildren) {
  return (
    <sup aria-hidden="true" className="text-gray-500">
      <em>
        <small>{children}</small>
      </em>
    </sup>
  );
}

export function Collection({ blog, project }: CollectionProps) {
  const filterTag = useStore($filterTag);
  const descLang = useStore($descriptionLang);

  const items: Collection = ([] as unknown as Collection)
    .concat(project, blog)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
    .filter((item) => {
      switch (filterTag) {
        case "Project":
          return item.data.tag === filterTag;
        case "Blog":
          return item.data.tag === filterTag;
        case "All":
        default:
          return true;
      }
    });
  const itemsCount = items.length;

  return (
    <>
      <div className="grid grid-cols-8 gap-10 sm:flex sm:flex-col-reverse">
        <div className="col-start-1 col-end-5 flex gap-10 items-start justify-between">
          <select
            className="bg-transparent py-1 pr-4 pl-2"
            onChange={(e) => $filterTag.set(e.target.value as FilterTag)}
          >
            {filters.map((filter) => (
              <option
                className="dark:text-gray-900"
                key={filter}
                value={filter}
              >
                {filter}
              </option>
            ))}
          </select>
          <Counter value={itemsCount} />
        </div>
        <div className="col-start-5 col-end-9 flex justify-end">
          <p className="text-xl">
            {descLang === "en" ? (
              <>
                A software engineer with a knack for design and occasionally
                building things. Currently exploring <Sup>(1)</Sup>software
                infrastructure, <Sup>(2)</Sup>zine design, <Sup>(3)</Sup>
                writing, and <Sup>(4)</Sup>
                <a href="/photo" className="underline">
                  photography
                </a>
                .{" "}
              </>
            ) : (
              <>
                Perekayasa perangkat lunak yang suka tidur, sedikit membaca,
                lain waktu merancang, dan terkadang menyusun kode berbuntut.
                Saat ini sedang mempelajari <Sup>(1)</Sup>infrastruktur
                perangkat lunak,
                <Sup>(2)</Sup>merancang zine, <Sup>(3)</Sup>menulis, dan{" "}
                <Sup>(4)</Sup>
                <a href="/photo" className="underline">
                  memotret
                </a>
                .
              </>
            )}
          </p>
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
