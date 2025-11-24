import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface SelectOption {
    value: string
    label: string
}

interface SelectProps {
    value: string
    onValueChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function Select({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    className,
    disabled = false,
}: SelectProps) {
    const [open, setOpen] = React.useState(false)

    const selectedOption = options.find((option) => option.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className={cn("block truncate", !selectedOption && "text-muted-foreground")}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={cn(
                                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                value === option.value && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                                onValueChange(option.value)
                                setOpen(false)
                            }}
                        >
                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                {value === option.value && <Check className="h-4 w-4" />}
                            </span>
                            <span className="truncate">{option.label}</span>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
