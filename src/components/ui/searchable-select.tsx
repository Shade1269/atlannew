import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: string[];
  searchPlaceholder?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  value, 
  onValueChange, 
  placeholder, 
  options, 
  isDarkMode = false, 
  disabled 
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const touchHandledRef = React.useRef<string | null>(null);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(option => 
      option.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    setOpen(false);
    setSearchQuery("");
    // Blur input after selection on mobile
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };
  
  // إعادة تعيين searchQuery عند تغيير value من الخارج
  React.useEffect(() => {
    if (!open && value) {
      setSearchQuery("");
    }
  }, [value, open]);

  // Auto-focus input when opening on mobile to trigger keyboard
  React.useEffect(() => {
    if (open && !disabled && inputRef.current) {
      // Use setTimeout to ensure the input is rendered and focusable
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // On mobile, sometimes we need to trigger click as well
        if (inputRef.current && 'click' in inputRef.current) {
          inputRef.current.click();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, disabled]);

  // إغلاق القائمة عند النقر خارجها
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && !target.closest('[data-searchable-select]')) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" data-searchable-select>
      {/* Search Input في مكان الاختيار */}
      <div className="relative">
        <Search className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none",
          isDarkMode ? "text-primary" : "text-primary/70"
        )} />
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          value={open ? searchQuery : (value || '')}
          onChange={(e) => {
            if (open) {
              setSearchQuery(e.target.value);
            } else {
              setOpen(true);
              setSearchQuery(e.target.value);
              // Focus input on mobile to trigger keyboard
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }
          }}
          onFocus={() => {
            if (!open && !disabled) {
            setOpen(true);
            }
            if (!searchQuery && value) {
              setSearchQuery('');
            }
          }}
          onBlur={(e) => {
            // Don't close if clicking on dropdown options
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (relatedTarget && relatedTarget.closest('[data-searchable-select]')) {
              return;
            }
            // Only blur if not selecting an option
            // We'll handle closing in handleValueChange
          }}
          placeholder={!value ? placeholder : undefined}
          readOnly={!open && !disabled}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 pr-9 pl-10 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !open && !disabled && "cursor-pointer",
            isDarkMode
              ? "!bg-gray-900 !border-primary/50 !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30 transition-all duration-300 hover:!border-primary"
              : "bg-white !border-primary/50 text-gray-900 placeholder:text-gray-500 focus:!border-primary focus:!ring-primary/20"
          )}
          onClick={() => {
            if (!open && !disabled) {
              setOpen(true);
              setSearchQuery('');
              // Focus input immediately to trigger mobile keyboard
              setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.click();
              }, 0);
            }
          }}
          onTouchStart={() => {
            // On mobile touch, ensure we open and focus
            if (!open && !disabled) {
              setOpen(true);
              setSearchQuery('');
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setOpen(!open);
              if (open) {
                setSearchQuery("");
              }
            }
          }}
          disabled={disabled}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2",
            isDarkMode ? "text-primary" : "text-primary/70",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-full mt-1 max-h-96 overflow-auto rounded-lg border shadow-lg p-2",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            isDarkMode
              ? "!bg-gray-900 !border-primary/30"
              : "bg-white !border-primary/30"
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className={cn(
              "py-6 px-2 text-center text-sm",
              isDarkMode ? "!text-white" : "text-gray-500"
            )}>
              لا توجد نتائج
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Prevent double trigger if already handled by touch
                  if (touchHandledRef.current !== option) {
                  handleValueChange(option);
                  }
                  touchHandledRef.current = null;
                }}
                onMouseDown={(e) => {
                  e.preventDefault(); // منع blur قبل click
                }}
                onTouchStart={(e) => {
                  // Handle touch on mobile - prevent double trigger
                  e.preventDefault();
                  e.stopPropagation();
                  touchHandledRef.current = option;
                  handleValueChange(option);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-lg border mb-2",
                  "min-h-[48px] py-3 px-4 text-sm outline-none",
                  "transition-all duration-150",
                  "touch-manipulation", // تحسين الاستجابة للمس في الموبايل
                  value === option
                    ? isDarkMode
                      ? "!bg-gray-900 !border-primary !text-white"
                      : "bg-gray-50 !border-primary text-gray-900"
                    : isDarkMode
                      ? "!bg-gray-900 !border-primary/30 !text-white hover:!border-primary/50 hover:!bg-gray-800 active:!bg-gray-800"
                      : "bg-white border-gray-200 text-gray-900 hover:!border-primary/50 hover:bg-gray-50 active:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  {value === option && (
                    <Check className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isDarkMode ? "text-primary" : "text-primary"
                    )} />
                  )}
                  <span className="flex-1 font-medium">{option}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

SearchableSelect.displayName = "SearchableSelect";

