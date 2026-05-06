import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";

export interface Option {
  value: string;
  label: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  disabled,
  className,
  placeholder = "Selecione..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If click is outside the select box AND outside the dropdown portal
      const target = event.target as Node;
      
      const isOutsideRef = ref.current && !ref.current.contains(target);
      const isOutsideDropdown = !document.getElementById('custom-select-portal-root')?.contains(target);
      
      if (isOutsideRef && isOutsideDropdown) {
        setIsOpen(false);
      }
    };
    
    // Create portal root if it doesn't exist
    if (!document.getElementById('custom-select-portal-root')) {
      const portalRoot = document.createElement('div');
      portalRoot.id = 'custom-select-portal-root';
      document.body.appendChild(portalRoot);
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240;

      let style: React.CSSProperties = {
        position: "fixed",
        width: rect.width,
        left: rect.left,
        zIndex: 9999,
      };

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        style.bottom = window.innerHeight - rect.top + 4;
      } else {
        style.top = rect.bottom + 4;
      }

      setDropdownStyle(style);
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find((o) => o.value === value);

  return (
    <>
      <div ref={ref} className={cn("relative w-full", className, disabled && "opacity-60 cursor-not-allowed")}>
        <div
          className={cn(
            "flex items-center justify-between w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-all cursor-pointer hover:bg-white/10",
            isOpen && "ring-1 ring-indigo-500 border-indigo-500",
            disabled && "pointer-events-none"
          )}
          onClick={openDropdown}
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
          <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform text-slate-400 shrink-0", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen &&
        document.getElementById('custom-select-portal-root') && 
        createPortal(
          <div onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: dropdownStyle.bottom ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dropdownStyle.bottom ? 10 : -10 }}
              transition={{ duration: 0.15 }}
              style={dropdownStyle}
              className="bg-[#13151A] border border-white/10 rounded-lg shadow-2xl shadow-black overflow-hidden ring-1 ring-white/5"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1">
                {options.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                      value === option.value ? "bg-indigo-500/20 text-indigo-300 font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          </div>,
          document.getElementById('custom-select-portal-root')!
        )}
    </>
  );
};
