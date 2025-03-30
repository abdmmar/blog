import { useStore } from "@nanostores/react";
import { $descriptionLang } from "../stores/collection";

function LangSwitcher() {
  const descLang = useStore($descriptionLang);
  return (
    <button
      className="bg-transparent border-none inline text-gray-500 hover:text-gray-900 transition-all dark:hover:text-gray-50"
      onClick={() => $descriptionLang.set(descLang === "id" ? "en" : "id")}
    >
      {descLang}
    </button>
  );
}

export default LangSwitcher;
