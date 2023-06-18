import { useStore } from "@nanostores/react";
import clsx from "clsx";
import { $filterTag, FilterTag } from "../stores/collection";

const filters: FilterTag[] = ["all", "blog", "project"];

export default function CollectionFilter() {
  const filterTag = useStore($filterTag);

  return (
    <ul className="col-span-4 flex gap-10 items-center">
      {filters.map((filter) => (
        <li key={filter}>
          <button
            className={clsx("rounded-sm font-ibmMono py-2 px-4", {
              ["border border-gray-300"]: filter === filterTag,
            })}
            onClick={() => $filterTag.set(filter)}
          >
            {filter.toUpperCase()}
          </button>
        </li>
      ))}
    </ul>
  );
}
