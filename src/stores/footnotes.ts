import { atom } from "nanostores";

export type FootnoteData = {
  id: string;
  text: string;
  top: number;
};

export const $footnotes = atom<FootnoteData[]>([]);

export function registerFootnote(data: FootnoteData) {
  const current = $footnotes.get();
  const exists = current.find((f) => f.id === data.id);
  if (!exists) {
    $footnotes.set([...current, data]);
  }
}

export function resetFootnotes() {
  $footnotes.set([]);
}
