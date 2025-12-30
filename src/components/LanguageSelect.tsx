import { Languages } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '@/i18n';

interface LanguageSelectProps {
    className?: string;
}

export function LanguageSelect({ className }: LanguageSelectProps) {
    const { i18n: i18nInstance } = useTranslation();

    const currentLanguage =
        SUPPORTED_LANGUAGES.find((l) => l.code === i18nInstance.language) ??
        SUPPORTED_LANGUAGES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('justify-start gap-2', className)}
                >
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span>{currentLanguage.label}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => i18nInstance.changeLanguage(lang.code)}
                        className={cn(
                            i18nInstance.language === lang.code && 'font-semibold'
                        )}
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}