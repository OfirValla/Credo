import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface SlidingSelectOption {
    value: string
    label: string
    icon?: React.ElementType
}

interface SlidingSelectProps {
    value: string
    onValueChange: (value: string) => void
    options: SlidingSelectOption[]
    placeholder?: string
    color?: string,
    textColor?: string,
}

export function SlidingSelect({
    value,
    onValueChange,
    options = [],
    color = "bg-secondary",
    textColor = "text-secondary-foreground",
}: SlidingSelectProps) {
    const layoutId = React.useId();

    return (
        <div className="bg-background/50 backdrop-blur-sm p-1 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar overflow-x-hidden">
                {options.map((option) => {
                    const isActive = value === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => onValueChange(option.value)}
                            className={cn(
                                "relative flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex-1 min-w-[80px]",
                                isActive
                                    ? cn("shadow-sm", textColor)
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId={layoutId}
                                    className={cn("absolute inset-0 rounded-xl", color)}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {option.icon && <option.icon className="w-4 h-4" />}
                                {option.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    )
}
