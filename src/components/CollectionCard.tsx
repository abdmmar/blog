import type { CollectionEntry } from "astro:content";
import clsx from "clsx";
import { HiArrowRight, HiArrowUpRight } from "react-icons/hi2";

type BlogProps = CollectionEntry<"blog">;
type ProjectProps = CollectionEntry<"project">;

export function CollectionCard({ post }: { post: BlogProps | ProjectProps }) {
  const link =
    post.data.tag.toLowerCase() === "project"
      ? (post as ProjectProps).data.link
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
}
