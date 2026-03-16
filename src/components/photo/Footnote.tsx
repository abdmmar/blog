import { useEffect } from "react";
import { registerFootnote, resetFootnotes } from "@/stores/footnotes";

type Props = {
  id: string;
  text: string;
};

export default function Footnote({ id, text }: Props) {
  useEffect(() => {
    // Register for mobile footnotes list
    registerFootnote({ id, text, top: 0 });

    const handleReset = () => resetFootnotes();
    window.addEventListener("reset-footnotes", handleReset);
    return () => window.removeEventListener("reset-footnotes", handleReset);
  }, [id, text]);

  return (
    <>
      <sup className="text-amber-600 dark:text-amber-400 cursor-help text-xs font-medium tabular-nums">
        {id}
      </sup>
      {/* Desktop: margin note floated to the right via CSS .sidenote rule */}
      <span className="sidenote">
        <span className="text-amber-600 dark:text-amber-400 font-medium mr-1 tabular-nums">
          {id}.
        </span>
        {text}
      </span>
    </>
  );
}
