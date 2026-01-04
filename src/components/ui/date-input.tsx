import * as React from "react"
import { Input, InputProps } from "@/components/ui/input"

export interface DateInputProps extends Omit<InputProps, "onChange"> {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    format?: 'DD/MM/YYYY' | 'MM/YYYY'
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, value, onChange, format = 'DD/MM/YYYY', ...props }, ref) => {

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            const numbers = inputValue.replace(/\D/g, "");

            // Validation Logic
            let dayPart = "";
            let monthPart = "";
            let yearPart = "";

            if (format === 'DD/MM/YYYY') {
                dayPart = numbers.slice(0, 2);
                monthPart = numbers.slice(2, 4);
                yearPart = numbers.slice(4, 8);
            } else { // MM/YYYY
                monthPart = numbers.slice(0, 2);
                yearPart = numbers.slice(2, 6);
            }

            // Validate Day
            if (dayPart) {
                const day = parseInt(dayPart);
                if (dayPart.length === 2) {
                    if (day === 0 || day > 31) return;
                } else {
                    if (day > 3) return;
                }
            }

            // Validate Month
            if (monthPart) {
                const month = parseInt(monthPart);
                if (monthPart.length === 2) {
                    if (month === 0 || month > 12) return;
                } else {
                    if (month > 1) return;
                }
            }

            // Validate Date existence (only for DD/MM/YYYY)
            if (format === 'DD/MM/YYYY' && dayPart.length === 2 && monthPart.length === 2) {
                const day = parseInt(dayPart);
                const month = parseInt(monthPart);
                // If year is not fully entered, assume leap year (2024) to allow typing 29/02
                const year = yearPart.length === 4 ? parseInt(yearPart) : 2024;

                const maxDays = new Date(year, month, 0).getDate();
                if (day > maxDays) return;
            }

            // Check if the user is deleting (backspace)
            // We compare the raw input length to the previous value length
            const isDeleting = inputValue.length < value.length;

            let formattedValue = "";

            if (format === 'DD/MM/YYYY') {
                if (numbers.length <= 2) {
                    formattedValue = numbers;
                    // Auto-append slash if 2 digits and not deleting
                    if (numbers.length === 2 && !isDeleting) {
                        formattedValue += '/';
                    }
                } else if (numbers.length <= 4) {
                    formattedValue = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
                    // Auto-append slash if 4 digits and not deleting
                    if (numbers.length === 4 && !isDeleting) {
                        formattedValue += '/';
                    }
                } else {
                    formattedValue = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
                }
            } else { // MM/YYYY
                if (numbers.length <= 2) {
                    formattedValue = numbers;
                    // Auto-append slash if 2 digits and not deleting
                    if (numbers.length === 2 && !isDeleting) {
                        formattedValue += '/';
                    }
                } else {
                    formattedValue = `${numbers.slice(0, 2)}/${numbers.slice(2, 6)}`;
                }
            }

            // Create a synthetic event to pass back
            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    value: formattedValue
                }
            };

            onChange(syntheticEvent);
        };

        return (
            <Input
                type="text"
                className={className}
                value={value}
                onChange={handleChange}
                ref={ref}
                maxLength={format === 'DD/MM/YYYY' ? 10 : 7}
                placeholder={format}
                {...props}
            />
        )
    }
)
DateInput.displayName = "DateInput"

export { DateInput }
