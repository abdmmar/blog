import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

export async function GET(context) {
  const posts = await getCollection("blog");
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    stylesheet: '/rss/pretty-feed-v3.xsl',
    items: posts.map((post) => ({
      ...post.data,
      pubDate: post.data.publishedAt,
      link: `/blog/${post.slug}/`,
    })).sort(
      (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
    ),
  });
}
