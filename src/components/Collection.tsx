import { useStore } from "@nanostores/react";
import { CollectionEntry, getCollection } from "astro:content";
import clsx from "clsx";
import { HiArrowRight, HiArrowUpRight } from "react-icons/hi2";
import { $filterTag } from "../stores/collection";
import { Masonry } from "./Masonry";

type BlogProps = CollectionEntry<"blog">;
type ProjectProps = CollectionEntry<"project">;
type Collection = (BlogProps | ProjectProps)[];

const blog = await getCollection("blog");
const project = await getCollection("project");

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

  return (
    <Masonry breakpoints={{ 1440: 4, 960: 2, 520: 1 }}>
      {items.map((post) => {
        const link =
          post.data.tag.toLowerCase() === "project"
            ? post.data.link
            : `/${post.data.tag.toLowerCase()}/${post.slug}`;

        return (
          <a
            key={post.id}
            href={link}
            target={post.data.tag.toLowerCase() === "project" ? "_blank" : ""}
            className="col-span-2 rounded-md border border-gray-200 p-4 flex flex-col gap-4 w-full"
          >
            <div className="flex justify-between items-center w-full">
              <div className="font-ibmMono">
                <small
                  className={clsx({
                    "text-green-600": post.data.tag.toLowerCase() === "blog",
                    "text-blue-600": post.data.tag.toLowerCase() === "project",
                  })}
                >
                  {post.data.tag.toUpperCase()}
                </small>
                <small className="text-gray-400"> • </small>
                <small className="text-gray-600">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "short",
                  }).format(post.data.publishedAt)}
                </small>
              </div>
              {post.data.tag === "Blog" ? (
                <HiArrowRight size="0.8rem" />
              ) : (
                <HiArrowUpRight size="0.8rem" />
              )}
            </div>
            {post.data.image ? (
              <img
                className="rounded-sm"
                alt={post.data.imageAlt}
                src={post.data.image.src}
              />
            ) : null}
            <div className="flex flex-col gap-2">
              <h3 className="text-xl">{post.data.title}</h3>
              <p className="text-gray-500">{post.data.description}</p>
            </div>
          </a>
        );
      })}
    </Masonry>
  );
}
