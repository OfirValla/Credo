import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Trash2, Edit2, Check, X, FolderOpen,
    Home, Building, Briefcase, Landmark, PiggyBank, Wallet, Key, Shield, Star, Heart
} from 'lucide-react';
import { useMortgagePortfolio } from '@/context/MortgagePortfolioContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const PORTFOLIO_COLORS = [
    'bg-slate-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
];

const PORTFOLIO_ICONS = [
    { name: 'Home', icon: Home },
    { name: 'Building', icon: Building },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Landmark', icon: Landmark },
    { name: 'PiggyBank', icon: PiggyBank },
    { name: 'Wallet', icon: Wallet },
    { name: 'Key', icon: Key },
    { name: 'Shield', icon: Shield },
    { name: 'Star', icon: Star },
    { name: 'Heart', icon: Heart },
];

export function Sidebar() {
    const { portfolios, currentPortfolioId, setCurrentPortfolioId, addPortfolio, removePortfolio, updatePortfolio } = useMortgagePortfolio();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleAdd = () => {
        if (newPortfolioName.trim()) {
            addPortfolio(newPortfolioName.trim(), PORTFOLIO_COLORS[Math.floor(Math.random() * PORTFOLIO_COLORS.length)]);
            setNewPortfolioName('');
            setIsAdding(false);
        }
    };

    const startEditing = (id: string, name: string) => {
        setEditingId(id);
        setEditName(name);
    };

    const saveEdit = () => {
        if (editingId && editName.trim()) {
            updatePortfolio(editingId, { name: editName.trim() });
            setEditingId(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleColorChange = (id: string, color: string) => {
        updatePortfolio(id, { color });
    };

    const handleIconChange = (id: string, iconName: string) => {
        updatePortfolio(id, { icon: iconName });
    };

    const getIconComponent = (iconName?: string) => {
        const iconData = PORTFOLIO_ICONS.find(i => i.name === iconName);
        return iconData ? iconData.icon : Home;
    };

    return (
        <motion.div
            className={cn(
                "fixed left-0 top-0 h-full bg-background/80 backdrop-blur-md border-r border-border z-50 shadow-lg transition-all duration-300 ease-in-out flex flex-col",
                isExpanded ? "w-64" : "w-16"
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => !isAdding && setIsExpanded(false)}
        >
            <div className="p-4 flex items-center justify-center border-b border-border h-16">
                <FolderOpen className="w-6 h-6" />
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-3 font-semibold text-lg whitespace-nowrap overflow-hidden"
                    >
                        Portfolios
                    </motion.span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2 px-2">
                {portfolios.map((portfolio) => {
                    const IconComponent = getIconComponent(portfolio.icon);

                    return (
                        <div
                            key={portfolio.id}
                            className={cn(
                                "group flex items-center p-2 rounded-lg cursor-pointer transition-colors relative",
                                currentPortfolioId === portfolio.id
                                    ? "bg-primary/10"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => !editingId && setCurrentPortfolioId(portfolio.id)}
                        >
                            <div className="min-w-[2rem] flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                                {editingId === portfolio.id ? (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-background flex items-center justify-center text-white shadow-sm",
                                                portfolio.color || 'bg-primary'
                                            )}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-4 space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm text-muted-foreground">Color</h4>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {PORTFOLIO_COLORS.map((color) => (
                                                        <div
                                                            key={color}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform",
                                                                color,
                                                                portfolio.color === color && "ring-2 ring-offset-2 ring-primary"
                                                            )}
                                                            onClick={() => handleColorChange(portfolio.id, color)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm text-muted-foreground">Icon</h4>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {PORTFOLIO_ICONS.map(({ name, icon: Icon }) => (
                                                        <div
                                                            key={name}
                                                            className={cn(
                                                                "w-8 h-8 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors border border-transparent",
                                                                portfolio.icon === name && "bg-primary/10 border-primary text-primary"
                                                            )}
                                                            onClick={() => handleIconChange(portfolio.id, name)}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-all group-hover:scale-110",
                                        portfolio.color || 'bg-primary'
                                    )}>
                                        <IconComponent className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="flex-1 flex items-center justify-between overflow-hidden ml-3">
                                    {editingId === portfolio.id ? (
                                        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-7 text-sm px-1"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit}>
                                                <Check className="w-3 h-3 text-green-500" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                                                <X className="w-3 h-3 text-red-500" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="truncate text-sm font-medium"
                                            >
                                                {portfolio.name}
                                            </motion.span>
                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6"
                                                                onClick={() => startEditing(portfolio.id, portfolio.name)}
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {portfolios.length > 1 && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                                    onClick={() => {
                                                                        if (confirm(`Delete portfolio "${portfolio.name}"?`)) {
                                                                            removePortfolio(portfolio.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-2 border-t border-border">
                {isExpanded ? (
                    isAdding ? (
                        <div className="flex items-center gap-2 p-2">
                            <Input
                                placeholder="Name..."
                                value={newPortfolioName}
                                onChange={(e) => setNewPortfolioName(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAdd();
                                    if (e.key === 'Escape') setIsAdding(false);
                                }}
                            />
                            <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd}>
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setIsAdding(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                            onClick={() => setIsAdding(true)}
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Portfolio</span>
                        </Button>
                    )
                ) : (
                    <div className="flex justify-center">
                        <Button size="icon" variant="ghost" onClick={() => { setIsExpanded(true); setIsAdding(true); }}>
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
