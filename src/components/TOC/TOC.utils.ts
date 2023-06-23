import type { MarkdownHeading } from "astro";

export interface TOC extends MarkdownHeading {
  children: MarkdownHeading[];
}

export default function buildTOC(headings: MarkdownHeading[]) {
  const toc: TOC[] = [];
  const parentHeadings = new Map();

  headings.forEach((h) => {
    const heading = { ...h, children: [] };
    parentHeadings.set(heading.depth, heading);
    // Change 2 to 1 if your markdown includes your <h1>
    if (heading.depth === 2) {
      toc.push(heading);
    } else {
      parentHeadings.get(heading.depth - 1).children.push(heading);
    }
  });

  return toc;
}
