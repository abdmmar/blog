import { useStore } from "@nanostores/react";
import { $footnotes } from "@/stores/footnotes";

type Props = {
  mobile?: boolean;
};

export default function FootnotesSidebar({ mobile }: Props) {
  const footnotes = useStore($footnotes);

  if (footnotes.length === 0) return null;

  // Only renders on mobile (hidden on desktop via parent CSS)
  return (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-5">
        Notes
      </h3>
      <ol className="list-none space-y-4">
        {footnotes.map((fn) => (
          <li
            key={fn.id}
            className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
          >
            <span className="text-amber-600 dark:text-amber-400 font-medium mr-1 tabular-nums">
              {fn.id}.
            </span>
            {fn.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
