import { LucideIcon } from "lucide-react"

export interface SlidingSelectOption {
    value: string
    label: string
    icon?: LucideIcon
}

interface SlidingSelectProps {
    value: string
    onValueChange: (value: string) => void
    options: SlidingSelectOption[]
    placeholder?: string
    color?: string
    textColor?: string
}

export function SlidingSelect({
    value,
    onValueChange,
    options = [],
    color = "bg-secondary",
    textColor = "text-secondary-foreground",
}: SlidingSelectProps) {
    const isRTL = document.documentElement.dir === 'rtl';

    const activeIndex = options.findIndex(
        (option) => option.value === value
    );

    const visualIndex = isRTL
        ? options.length - 1 - activeIndex
        : activeIndex;

    return (
        <div
            className="relative grid grid-flow-col auto-cols-fr gap-2 p-1 bg-background/50 rounded-lg border border-border/50"
            style={
                { '--index': visualIndex } as React.CSSProperties
            }
        >
            {/* Sliding highlight */}
            <div
                className={`absolute top-1 left-1 h-[calc(100%-0.5rem)] ${color} rounded-md shadow-sm transition-all duration-300`}
                style={{
                    transform: `translateX(calc(var(--index, 0) * 100% + var(--index, 0) * 0.5rem))`,
                    width: `calc((100% - 0.5rem - (0.5rem * (${options.length} - 1))) / ${options.length})`,
                }}
            />

            {/* Options */}
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`relative z-10 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium ${value === option.value
                        ? textColor
                        : 'text-muted-foreground'
                        } transition-all`}
                    onClick={() => onValueChange(option.value)}
                >
                    {option.icon && <option.icon />}
                    {option.label}
                </button>
            ))}
        </div>
    );
}
