import { CollectionEntry, getCollection } from "astro:content";
import * as React from "react";
import { HiArrowRight, HiArrowUpRight } from "react-icons/hi2";
import { Masonry } from "./Masonry";

type ContentProps = CollectionEntry<"blog">;

const blog = await getCollection("blog");

export function Collection() {
  const items: ContentProps[] = blog;

  React.useEffect(() => {
    const url = window.location.search;
  }, []);

  return (
    <Masonry breakpoints={{ 1440: 4, 960: 2, 520: 1 }}>
      {items.map((post) => {
        return (
          <a
            key={post.id}
            href={`/blog/${post.slug}`}
            className="col-span-2 rounded-md border border-gray-200 p-4 flex flex-col gap-4 w-full"
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-5 font-ibmMono">
                <small className="text-green-600">
                  {post.data.tag.toUpperCase()}
                </small>
                <small className="text-gray-600">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "short",
                  }).format(post.data.publishedAt)}
                </small>
              </div>
              {post.data.tag === "Writing" ? (
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
