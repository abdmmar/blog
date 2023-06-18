import { atom } from "nanostores";

export type FilterTag = "all" | "blog" | "project";

export const $filterTag = atom<FilterTag>("all");
