import { getCollection } from "astro:content";
import { Masonry } from "./Masonry";

const blog = await getCollection("blog");

export function Collection() {
  return (
    <Masonry breakpoints={{ 1440: 4, 960: 2, 520: 1 }}>
      {blog.map((post) => (
        <div
          key={post.id}
          className="col-span-2 rounded-md border border-gray-200 p-4 flex flex-col gap-4 w-full"
        >
          {post.id}
        </div>
      ))}
    </Masonry>
  );
}
