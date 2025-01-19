import * as Dialog from "@radix-ui/react-dialog";
import copy from "copy-to-clipboard";
import { useState } from "react";
import { HiXMark } from "react-icons/hi2/index";

const links = ["Twitter", "LinkedIn", "Facebook", "Copy Link"] as const;
type Links = (typeof links)[number];

const BASE_URL = "https://abdmmar.com";

export default function ShareButton({
  title = "Abdullah Ammar",
  description = "A student and developer",
  slug = "/",
}: {
  title?: string;
  description?: string;
  slug?: string;
}) {
  const [isCopied, setCopied] = useState(false);
  const isShareSupported = typeof window !== "undefined" && !!navigator?.share;
  const url = BASE_URL + slug;

  const handleShare = async () => {
    if (typeof window !== "undefined" && navigator?.share) {
      try {
        await navigator?.share({
          title: title,
          text: description,
          url,
        });
        console.log("Thanks for sharing!");
        return;
      } catch (err) {
        console.error(err);
      }
    } else {
      open();
    }
  };

  const handleLink = (type: Links) => (url: string, description?: string) => {
    switch (type) {
      case "Twitter":
        socialWindow(
          `https://twitter.com/intent/tweet?url=${url}&text=${description}`
        );
        break;
      case "Facebook":
        socialWindow(`https://www.facebook.com/sharer.php?u=${url}`);
        break;
      case "LinkedIn":
        socialWindow(
          `https://www.linkedin.com/shareArticle?mini=true&url=${url}`
        );
        break;
      case "Copy Link":
      default:
        copy(url);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1000);
        break;
    }
  };

  return (
    <Dialog.Root>
      {isShareSupported ? (
        <button
          onClick={handleShare}
          className="text-gray-600 dark:text-gray-400 py-1 px-2 rounded-sm bg-white hover:bg-gray-100 transition-all dark:bg-gray-950 dark:hover:bg-gray-900"
        >
          Share
        </button>
      ) : (
        <Dialog.Trigger asChild>
          <button className="text-gray-600 dark:text-gray-400 py-1 px-2 rounded-sm bg-white hover:bg-gray-100 transition-all dark:bg-gray-950 dark:hover:bg-gray-900">
            Share
          </button>
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-400 dark:bg-gray-600 dark:bg-opacity-50 bg-opacity-50 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white dark:bg-gray-900 p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
          <div className="flex justify-between items-center mb-4 ">
            <Dialog.Title asChild>
              <h4 className="text-lg font-medium">Share this posts</h4>
            </Dialog.Title>
            <Dialog.Close className="p-1 border border-gray-200 dark:border-gray-700 rounded-sm hover:dark:bg-gray-800 hover:bg-gray-100 dark:bg-gray-900 bg-white transition-all">
              <HiXMark />
            </Dialog.Close>
          </div>
          <ul className="list-none grid grid-cols-2 gap-4">
            {links.map((link) => (
              <li key={link}>
                <button
                  className="px-1 py-2 w-full text-gray-600 dark:text-gray-200 text-base border border-gray-200 rounded-sm dark:border-gray-700 hover:dark:bg-gray-800 hover:bg-gray-100 dark:bg-gray-900 bg-white transition-all"
                  onClick={() => handleLink(link)(url, description)}
                >
                  {link === "Copy Link" && isCopied ? "Copied" : link}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function socialWindow(url: string) {
  const left = (screen.width - 570) / 2;
  const top = (screen.height - 570) / 2;
  const params = `menubar=no,toolbar=no,status=no,width=570,height=570,top=${top},left=${left}`;
  window.open(url, "NewWindow", params);
}
