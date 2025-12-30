import { SlidingSelect } from "./ui/sliding-select";
import { Theme, useTheme } from "@/context/ThemeProvider";
import { useTranslation } from "react-i18next";

export function ThemeSelect() {
    const { t } = useTranslation("common"); // Use "settings" namespace
    const { theme, setTheme } = useTheme();

    return (
        <SlidingSelect
            value={theme}
            onValueChange={(v) => setTheme(v as Theme)}
            options={[
                { value: Theme.SYSTEM, label: t("theme.options.system") },
                { value: Theme.LIGHT, label: t("theme.options.light") },
                { value: Theme.DARK, label: t("theme.options.dark") },
            ]}
            color="bg-primary"
            textColor="text-primary-foreground"
        />
    );
}