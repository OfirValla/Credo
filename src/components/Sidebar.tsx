import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, FolderOpen, LayoutDashboard, Home, Settings, Download, MessageSquare } from 'lucide-react';
import { usePortfolios } from '@/context/PortfoliosContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useNavigate, useLocation } from 'react-router';
import { PORTFOLIO_COLORS, PORTFOLIO_ICONS } from '@/lib/constants';
import { PortfolioCreationModal } from './modals/PortfolioCreationModal';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal';
import { Portfolio } from '@/types';
import { SettingsModal } from './modals/SettingsModal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ImportAll } from './ImportAll';

import { FeedbackModal } from './modals/FeedbackModal';

enum ModalType {
    PORTFOLIO_CREATION,
    SETTINGS,
    FEEDBACK
}

export function Sidebar() {
    const { portfolios, removePortfolio, updatePortfolio, exportAllPortfolios } = usePortfolios();
    const [isExpanded, setIsExpanded] = useState(false);
    const [modalType, setModalType] = useState<ModalType | null>(null);
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('common');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [portfolioToDelete, setPortfolioToDelete] = useState<Portfolio | null>(null);
    const [editName, setEditName] = useState('');

    // Derive current portfolio ID from the URL path
    const pathParts = location.pathname.split('/');
    // Format: /:type/:portfolioId
    const activePortfolioId = pathParts.length >= 3 ? pathParts[2] : 'overview';

    const handleNewPortfolioClick = () => {
        if (isMobile)
            navigate('/portfolio/create');
        else
            setModalType(ModalType.PORTFOLIO_CREATION);
    };

    const handleSettingsClick = () => {
        if (isMobile)
            navigate('/settings');
        else
            setModalType(ModalType.SETTINGS);
    };

    const handleFeedbackClick = () => {
        if (isMobile)
            navigate('/feedback');
        else
            setModalType(ModalType.FEEDBACK);
    };

    const startEditing = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        e.preventDefault();

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

    const handleDeletePortfolio = () => {
        if (!portfolioToDelete) return;

        const isCurrent = activePortfolioId === portfolioToDelete.id;
        removePortfolio(portfolioToDelete.id);
        toast.success(t('delete-modal.success'));

        if (isCurrent) {
            navigate('/');
        }
        setPortfolioToDelete(null);
    };

    return (
        <>
            <PortfolioCreationModal
                isOpen={modalType === ModalType.PORTFOLIO_CREATION}
                onClose={() => setModalType(null)}
            />
            <SettingsModal
                isOpen={modalType === ModalType.SETTINGS}
                onClose={() => setModalType(null)}
            />
            <FeedbackModal
                isOpen={modalType === ModalType.FEEDBACK}
                onClose={() => setModalType(null)}
            />
            <DeleteConfirmationModal
                isOpen={!!portfolioToDelete}
                onClose={() => setPortfolioToDelete(null)}
                onConfirm={handleDeletePortfolio}
                itemName={portfolioToDelete?.name}
            />

            <motion.div
                className={cn(
                    "fixed start-0 top-0 h-full bg-background/80 backdrop-blur-md border-r border-border z-40 shadow-lg transition-all duration-300 ease-in-out flex flex-col",
                    isExpanded ? "w-64" : "w-16"
                )}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >

                {/* Title */}
                <div className="px-2 py-2 border-b border-border">
                    <Link
                        to="/"
                        className="group flex gap-3 items-center justify-center p-2 rounded-lg cursor-pointer relative"
                    >
                        <div className="min-w-[2rem] ms-3 flex justify-center items-center">
                            <FolderOpen className="w-6 h-6" />
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                                "font-semibold text-lg whitespace-nowrap overflow-hidden",

                                // isExpanded ? "ml-3" : ""
                            )}
                        >
                            {t('sidebar.portfolios')}
                        </motion.span>
                    </Link>
                </div>

                {/* Overview */}
                <div className="px-2 py-2 border-b border-border">
                    <Link
                        to="/"
                        className={cn(
                            "group flex items-center p-2 rounded-lg cursor-pointer transition-colors relative",
                            activePortfolioId === 'overview'
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className="min-w-[2rem] flex justify-center items-center">
                            <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden"
                        >
                            {t('sidebar.overview')}
                        </motion.span>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto py-2 space-y-2 px-2">

                    {/* Portfolios */}
                    {
                        portfolios.map((portfolio) => {
                            const IconComponent = getIconComponent(portfolio.icon);

                            return (
                                <div
                                    key={portfolio.id}
                                    className={cn(
                                        "group flex items-center p-2 rounded-lg cursor-pointer transition-colors relative",
                                        activePortfolioId === portfolio.id
                                            ? "bg-primary/10"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => {
                                        if (!editingId) {
                                            navigate(`/${portfolio.type}/${portfolio.id}`);
                                        }
                                    }}
                                >

                                    {/* Portfolio icon */}
                                    <div className="min-w-[2rem] flex justify-center items-center">
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
                                                        <h4 className="font-medium text-sm text-muted-foreground">{t('sidebar.color')}</h4>
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
                                                        <h4 className="font-medium text-sm text-muted-foreground">{t('sidebar.icon')}</h4>
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

                                    {/* Portfolio name + Action Icons */}
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
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex-1 overflow-hidden min-w-0"
                                                >
                                                    <ScrollingName name={portfolio.name} />
                                                </motion.div>

                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6"
                                                                    onClick={(e) => startEditing(e, portfolio.id, portfolio.name)}
                                                                >
                                                                    <Edit2 className="w-3 h-3" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('sidebar.edit')}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                                    onClick={() => setPortfolioToDelete(portfolio)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('sidebar.delete')}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                <div className="p-2 border-t border-border space-y-1">
                    <Button
                        variant="ghost"
                        className={cn(
                            "group flex justify-start items-center p-2 rounded-lg cursor-pointer transition-colors relative hover:bg-muted hover:text-foreground w-full"
                        )}
                        onClick={handleNewPortfolioClick}
                    >
                        <div className="min-w-[2rem] flex justify-center items-center">
                            <Plus className="w-5 h-5" />
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden"
                        >
                            {t('sidebar.newPortfolio')}
                        </motion.span>
                    </Button>
                </div>

                <div className="p-2 border-t border-border space-y-1">
                    <Button
                        variant="ghost"
                        className={cn(
                            "group flex justify-start items-center p-2 rounded-lg cursor-pointer transition-colors relative hover:bg-muted hover:text-foreground w-full"
                        )}
                        onClick={exportAllPortfolios}
                    >
                        <div className="min-w-[2rem] flex justify-center items-center">
                            <Download className="w-5 h-5" />
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden"
                        >
                            {t('exportAll')}
                        </motion.span>
                    </Button>

                    <ImportAll />
                </div>

                <div className="p-2 border-t border-border space-y-1">
                    <Button
                        variant="ghost"
                        className={cn(
                            "group flex justify-start items-center p-2 rounded-lg cursor-pointer transition-colors relative hover:bg-muted hover:text-foreground w-full",
                            location.pathname === '/feedback' && "bg-primary/10 text-primary"
                        )}
                        onClick={handleFeedbackClick}
                    >
                        <div className="min-w-[2rem] flex justify-center items-center">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden"
                        >
                            {t('feedback.title')}
                        </motion.span>
                    </Button>
                </div>

                <div className="p-2 border-t border-border space-y-1">
                    <Button
                        variant="ghost"
                        className={cn(
                            "group flex justify-start items-center p-2 rounded-lg cursor-pointer transition-colors relative hover:bg-muted hover:text-foreground w-full",
                            location.pathname === '/settings' && "bg-primary/10 text-primary"
                        )}
                        onClick={handleSettingsClick}
                    >
                        <div className="min-w-[2rem] flex justify-center items-center">
                            <Settings className="w-5 h-5" />
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden"
                        >
                            {t('sidebar.settings')}
                        </motion.span>
                    </Button>
                </div>
            </motion.div>
        </>
    );
}

function ScrollingName({ name }: { name: string }) {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [scrollDistance, setScrollDistance] = useState(0);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current) {
                const { clientWidth, scrollWidth } = containerRef.current;
                const isOver = scrollWidth > clientWidth;
                setIsOverflowing(isOver);
                if (isOver) {
                    setScrollDistance(clientWidth - scrollWidth);
                } else {
                    setScrollDistance(0);
                }
            }
        };

        // Initial check
        checkOverflow();

        // Use ResizeObserver for robust monitoring
        const resizeObserver = new ResizeObserver(() => {
            checkOverflow();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [name]);

    return (
        <div
            ref={containerRef}
            className="overflow-hidden w-full mask-linear-fade"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                className="whitespace-nowrap inline-block"
                initial={{ x: 0 }}
                animate={isHovered && isOverflowing ? {
                    x: scrollDistance,
                    transition: {
                        duration: Math.abs(scrollDistance) / 30,
                        repeat: Infinity,
                        repeatType: "reverse",
                        repeatDelay: 1,
                        ease: "linear",
                        type: "tween"
                    }
                } : {
                    x: 0,
                    transition: { duration: 0.3 }
                }}
            >
                <span ref={textRef} className="text-sm font-medium select-none pr-2">
                    {name}
                </span>
            </motion.div>
        </div>
    );
}
