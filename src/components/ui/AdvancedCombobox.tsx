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

// Hacemos el componente genérico con <T>
interface AdvancedComboboxProps<T> {
  options: T[];
  value?: string;
  onChange: (value: string) => void;
  // Funciones para acceder a las propiedades del objeto T
  valueAccessor: (option: T) => string;
  // No necesitamos labelAccessor si siempre usamos renderOption
  
  // Prop para renderizar la opción de forma personalizada
  renderOption: (option: T) => React.ReactNode;
  
  // Prop para una función de filtrado personalizada
  filterFn: (options: T[], searchValue: string) => T[];

  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  popoverClassName?: string;
  renderHeader?: () => React.ReactNode;
  sideOffset?: number;
  align?: "start" | "center" | "end";
  // Para mostrar el label del elemento seleccionado en el botón
  displayValue?: (value: string) => React.ReactNode;
}

export function AdvancedCombobox<T>({
  options,
  value,
  onChange,
  valueAccessor,
  renderOption,
  filterFn,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  disabled = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  popoverClassName,
  renderHeader,
  sideOffset = 4,
  align = "center",
  displayValue,
}: AdvancedComboboxProps<T>) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen || setInternalOpen;

  // Usamos la función de filtrado personalizada
  const filteredOptions = React.useMemo(() => {
    return filterFn(options, searchValue);
  }, [options, searchValue, filterFn]);

  const selectedDisplayValue = React.useMemo(() => {
    if (displayValue && value) {
      return displayValue(value);
    }
    // Fallback por si no se provee displayValue
    const selectedOption = options.find(option => valueAccessor(option) === value);
    return selectedOption ? String(selectedOption) : placeholder; // Deberíamos tener un labelAccessor para esto
  }, [options, value, valueAccessor, displayValue, placeholder]);


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
          <span className="truncate">{value ? selectedDisplayValue : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        sideOffset={sideOffset}
        align={align}
        className={cn("w-[--radix-popover-trigger-width] max-h-96 p-0 flex flex-col", popoverClassName)}
      >
        <div className="p-2 flex-shrink-0">
            <Input
                autoFocus
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9"
            />
        </div>
        <div className="flex-grow overflow-y-auto">
            <ScrollArea className="h-full">
                {renderHeader && renderHeader()}
                <div className="p-2 pt-0">
                    {filteredOptions.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            {emptyMessage}
                        </p>
                    )}
                    {filteredOptions.map((option, index) => {
                        const optionValue = valueAccessor(option);
                        return (
                            <Button
                                key={index} // Usar index como último recurso si los valores no son únicos
                                variant="ghost"
                                className="w-full justify-start font-normal h-auto"
                                onClick={() => {
                                    onChange(optionValue);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === optionValue ? "opacity-100" : "opacity-0"
                                )}
                                />
                                <div className="w-full">
                                  {renderOption(option)}
                                </div>
                            </Button>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}