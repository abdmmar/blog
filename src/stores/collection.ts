import { atom } from "nanostores";

export type FilterTag = "all" | "blog" | "project" | "photography";

export const $filterTag = atom<FilterTag>("all");
