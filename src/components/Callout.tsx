import { HiOutlineInformationCircle } from "react-icons/hi2";

export default function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[min-content_1fr] items-start gap-2 p-3 pr-4 my-2 mb-4 bg-slate-200">
      <div className="p-1 flex items-center">
        <HiOutlineInformationCircle className="text-blue-600 w-6 h-6" />
      </div>
      <div>{children}</div>
    </div>
  );
}
