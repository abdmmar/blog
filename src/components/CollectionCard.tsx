import { cn } from "@/utils";
import type { CollectionEntry } from "astro:content";
import { motion } from "framer-motion";
import { HiArrowRight, HiArrowUpRight } from "react-icons/hi2/index";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

type BlogProps = CollectionEntry<"blog">;
type ProjectProps = CollectionEntry<"project">;
type PhotoProps = CollectionEntry<"photo">;

export function CollectionCard({
  post,
}: {
  post: BlogProps | ProjectProps | PhotoProps;
}) {
  switch (post.data.tag) {
    case "Project":
      return <ProjectCard post={post as ProjectProps} />;
    case "Blog":
      return <BlogCard post={post as BlogProps} />;
    case "Photography":
      return <PhotoCard photo={post as PhotoProps} />;
    default:
      return null;
  }
}

function BlogCard({ post }: { post: BlogProps }) {
  const link = `/${post.data.tag.toLowerCase()}/${post.slug}`;
  const isImageExist = !!post.data.image;

  return (
    <motion.a
      whileHover={{
        scale: 1.1,
        transition: { duration: "150ms" },
      }}
      key={post.id}
      href={link}
      className={cn(
        "col-span-2 rounded-md border transition-all p-4 flex flex-col gap-4 w-full h-fit",
        "dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 bg-white",
        "hover:border-green-600 dark:hover:border-green-600",
      )}
    >
      <div className="flex justify-between items-center w-full">
        <div className="font-ibmMono">
          <small className="text-green-600">{post.data.tag}</small>
          <small className="text-gray-400 dark:text-gray-600"> • </small>
          <small className="text-gray-600 dark:text-gray-400">
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "short",
            }).format(post.data.publishedAt)}
          </small>
        </div>
        <HiArrowRight size="0.8rem" />
      </div>
      {post.data.image ? (
        <img
          className="rounded-sm"
          alt={post.data.imageAlt}
          src={post.data.image.src}
          width={post.data.image.width}
          height={post.data.image.height}
        />
      ) : null}
      <div className="flex flex-col gap-2">
        <span className={cn("text-xl", { "mt-10": !isImageExist })}>
          {post.data.title}
        </span>
        <p className="text-gray-500">{post.data.description}</p>
      </div>
    </motion.a>
  );
}

function ProjectCard({ post }: { post: ProjectProps }) {
  const link = post.data.link;

  return (
    <motion.a
      whileHover={{
        scale: 1.1,
        transition: { duration: "150ms" },
      }}
      href={link}
      target="_blank"
      className={cn(
        "col-span-2 rounded-md border transition-all flex flex-col w-full h-fit",
        "dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 bg-white",
        "hover:border-blue-600 dark:hover:border-blue-600"
      )}
    >
      <div className="flex justify-between items-center w-full p-4 ">
        <div className="font-ibmMono">
          <small className="text-blue-600">{post.data.tag}</small>
          <small className="text-gray-400 dark:text-gray-600"> • </small>
          <small className="text-gray-600 dark:text-gray-400">
            {post.data.title}
          </small>
        </div>
        <HiArrowUpRight size="0.8rem" />
      </div>
      {post.data.image ? (
        <img
          className="rounded-sm"
          src={post.data.image.src}
          width={post.data.image.width}
          height={post.data.image.height}
          alt={post.data.imageAlt}
        />
      ) : null}
    </motion.a>
  );
}

function PhotoCard({ photo }: { photo: PhotoProps }) {
  return (
    <motion.div
      whileHover={{
        scale: 1.1,
        transition: { duration: "150ms" },
      }}
      className={cn(
        "col-span-2 rounded-md border transition-all flex flex-col w-full h-fit",
        "dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 bg-white",
        "hover:border-yellow-500 dark:hover:border-yellow-500"
      )}
    >
      <Zoom>
        <img
          className="rounded-md h-fit"
          alt={photo.data.title}
          src={photo.data.image.src}
          width={photo.data.image.width}
          height={photo.data.image.height}
        />
      </Zoom>
    </motion.div>
  );
}
