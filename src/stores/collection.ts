import { atom } from "nanostores";

export type FilterTag = "All" | "Blog" | "Project" | "Photography";

export const $filterTag = atom<FilterTag>("All");
export const $descriptionLang = atom<"id" | "en">("en");
