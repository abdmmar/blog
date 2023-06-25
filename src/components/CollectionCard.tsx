import { cn } from "@/utils";
import type { CollectionEntry } from "astro:content";
import { motion } from "framer-motion";
import { HiArrowRight, HiArrowUpRight } from "react-icons/hi2/index";

type BlogProps = CollectionEntry<"blog">;
type ProjectProps = CollectionEntry<"project">;

export function CollectionCard({ post }: { post: BlogProps | ProjectProps }) {
  const link =
    post.data.tag.toLowerCase() === "project"
      ? (post as ProjectProps).data.link
      : `/${post.data.tag.toLowerCase()}/${post.slug}`;

  return (
    <motion.a
      whileHover={{
        scale: 1.1,
        transition: { duration: "150ms" },
      }}
      key={post.id}
      href={link}
      target={post.data.tag.toLowerCase() === "project" ? "_blank" : ""}
      className={cn(
        "col-span-2 rounded-md border transition-all p-4 flex flex-col gap-4 w-full",
        "dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 bg-white",
        {
          "hover:border-green-600 dark:hover:border-green-600":
            post.data.tag.toLowerCase() === "blog",
          "hover:border-blue-600  dark:hover:border-blue-600":
            post.data.tag.toLowerCase() === "project",
        }
      )}
    >
      <div className="flex justify-between items-center w-full">
        <div className="font-ibmMono">
          <small
            className={cn("uppercase", {
              "text-green-600": post.data.tag.toLowerCase() === "blog",
              "text-blue-600": post.data.tag.toLowerCase() === "project",
            })}
          >
            {post.data.tag}
          </small>
          <small className="text-gray-400 dark:text-gray-600"> • </small>
          <small className="text-gray-600 dark:text-gray-400">
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
        <span className="text-xl">{post.data.title}</span>
        <p className="text-gray-500">{post.data.description}</p>
      </div>
    </motion.a>
  );
}
