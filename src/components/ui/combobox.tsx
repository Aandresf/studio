"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "./scroll-area";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  popoverClassName?: string;
  renderHeader?: () => React.ReactNode;
  renderOption?: (option: ComboboxOption) => React.ReactNode;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  disabled = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  popoverClassName,
  renderHeader,
  renderOption,
}: ComboboxProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen || setInternalOpen;

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  const selectedLabel = React.useMemo(() => {
    return options.find((option) => option.value === value)?.label;
  }, [options, value]);

  // Reset search value when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">{value ? selectedLabel : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", popoverClassName)}>
        <div className="p-2">
            <Input
                autoFocus
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9"
            />
        </div>
        <ScrollArea className="h-auto max-h-60">
            {renderHeader && renderHeader()}
            <div className="p-2 pt-0">
                {filteredOptions.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        {emptyMessage}
                    </p>
                )}
                {filteredOptions.map((option) => (
                <Button
                    key={option.value}
                    variant="ghost"
                    className="w-full justify-start font-normal h-auto"
                    onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                    }}
                >
                    <Check
                    className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                    )}
                    />
                    {renderOption ? renderOption(option) : option.label}
                </Button>
                ))}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
