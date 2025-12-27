import { SlidingSelect } from "./ui/sliding-select";
import { Theme, useTheme } from "@/context/ThemeProvider";

export function ThemeSelect() {
    const { theme, setTheme } = useTheme();

    return (
        <SlidingSelect
            value={theme}
            onValueChange={(v) => setTheme(v as Theme)}
            options={[
                { value: Theme.SYSTEM, label: 'System' },
                { value: Theme.LIGHT, label: 'Light' },
                { value: Theme.DARK, label: 'Dark' },
            ]}
            color="bg-primary"
            textColor="text-primary-foreground"
        />
    );
}