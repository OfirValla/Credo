import * as React from "react"

export interface SlidingSelectOption {
    value: string
    label: string
}

interface SlidingSelectProps {
    value: string
    onValueChange: (value: string) => void
    options: SlidingSelectOption[]
    placeholder?: string
    color?: string,
    defaultValue?: string
}

export function SlidingSelect({
    value,
    onValueChange,
    options = [],
    color = "bg-secondary",
    defaultValue
}: SlidingSelectProps) {
    const [selected, setSelected] = React.useState(defaultValue || options.at(0)?.value)
    console.log(defaultValue, selected)
    React.useEffect(() => {
        onValueChange(selected!)
    }, [selected]);

    return (
        <div
            className="relative grid grid-cols-2 gap-2 p-1 bg-background/50 rounded-lg border border-border/50"
            style={{ "--index": options.findIndex((option) => option.value === value) } as React.CSSProperties}
        >
            {/* <!-- Sliding highlight --> */}
            <div
                className={`absolute top-1 left-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.5rem)] ${color} rounded-md shadow-sm transition-all duration-300`}
                style={{ transform: 'translateX(calc(var(--index, 0) * 100%))' }}>
            </div>

            {/* <!-- Options --> */}
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className="relative z-10 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-secondary-foreground transition-all"
                    onClick={() => setSelected(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
