import { HiOutlineInformationCircle } from "react-icons/hi2";

type CalloutProps = { children: React.ReactNode; title?: React.ReactNode };
export default function Callout({ children, title }: CalloutProps) {
  return (
    <div className="grid grid-cols-[min-content_1fr] items-start gap-2 p-3 pr-4 my-2 mb-4 border border-gray-200 dark:border-gray-800 rounded-sm bg-gray-100 dark:bg-gray-900">
      <div className="p-1 flex items-center">
        <HiOutlineInformationCircle className="text-blue-600 w-6 h-6" />
      </div>
      <div>
        {typeof title === "string" ? (
          <div className="min-h-[32px] flex items-center">
            <strong>{title}</strong>
          </div>
        ) : (
          title
        )}
        {children}
      </div>
    </div>
  );
}
