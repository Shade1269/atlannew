import React from "react";
import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderCompareButtonProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export const HeaderCompareButton: React.FC<HeaderCompareButtonProps> = ({
  count,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-md sm:shadow-lg hover:shadow-xl bg-white dark:bg-black border-2 border-blue-500",
        className
      )}
    >
      <GitCompare className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] sm:text-[10px] min-w-[14px] sm:min-w-[18px] h-[14px] sm:h-[18px] rounded-full flex items-center justify-center font-bold">
          {count > 4 ? "4" : count}
        </span>
      )}
    </button>
  );
};
