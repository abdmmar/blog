import * as Dialog from "@radix-ui/react-dialog";
import copy from "copy-to-clipboard";
import { useState } from "react";
import { HiXMark } from "react-icons/hi2";

const links = ["Twitter", "LinkedIn", "Facebook", "Copy Link"] as const;
type Links = (typeof links)[number];

export default function ShareButton({
  title = "Abdullah Ammar",
  description = "A student and developer",
  text = "Share this article",
  url = "https://abdmmar.com",
}: {
  title?: string;
  description?: string;
  text?: string;
  url?: string;
}) {
  const [isCopied, setCopied] = useState(false);
  const isShareSupported = typeof window !== "undefined" && !!navigator?.share;

  const handleShare = async () => {
    if (typeof window !== "undefined" && navigator?.share) {
      try {
        await navigator?.share({
          title: title,
          text: description,
          url: url,
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

  const handleLink = (url: Links) => {
    switch (url) {
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
        <button onClick={handleShare} className="text-gray-600">
          {"share".toUpperCase()}
        </button>
      ) : (
        <Dialog.Trigger asChild>
          <button className="text-gray-600">{"share".toUpperCase()}</button>
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-400 bg-opacity-50 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
          <div className="flex justify-between items-center mb-4 ">
            <Dialog.Title asChild>
              <h4 className="text-lg font-medium">Share this posts</h4>
            </Dialog.Title>
            <Dialog.Close className="p-1 border border-gray-200 rounded-sm hover:bg-gray-100 bg-white transition-all">
              <HiXMark />
            </Dialog.Close>
          </div>
          <ul className="list-none grid grid-cols-2 gap-4">
            {links.map((link) => (
              <li key={link}>
                <button
                  className="px-1 py-2 w-full text-gray-600 text-base border border-gray-200 rounded-sm hover:bg-gray-100 bg-white transition-all"
                  onClick={() => handleLink(link)}
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
