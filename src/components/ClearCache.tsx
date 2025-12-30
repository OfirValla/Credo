import React, { useCallback, useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { usePortfolios } from '@/context/PortfoliosContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const MotionButton = motion(Button);

export const ClearCache: React.FC = () => {
    const { t } = useTranslation('common'); // settings namespace
    const { removeAllPortfolios } = usePortfolios();
    const navigate = useNavigate();
    const [areYouSure, setAreYouSure] = useState(false);

    const handleConfirm = useCallback(() => {
        removeAllPortfolios();
        navigate('/');
        setAreYouSure(false);
    }, [removeAllPortfolios, navigate]);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t('clear-cache.warning')}
            </div>

            <div className="flex gap-2">
                {/* Main destructive button */}
                <MotionButton
                    layout
                    variant="destructive"
                    onClick={areYouSure ? handleConfirm : () => setAreYouSure(true)}
                    className="flex-1 relative overflow-hidden"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                >
                    <div className="relative h-[1.5rem] w-full">
                        <AnimatePresence mode="sync">
                            {!areYouSure ? (
                                <motion.div
                                    key="initial-text"
                                    initial={{ opacity: 0, y: 6, position: 'absolute', width: '100%' }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex justify-center items-center gap-2"
                                    transition={{ duration: 0.3 }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>{t('clear-cache.button')}</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="confirm-text"
                                    initial={{ opacity: 0, y: 6, position: 'absolute', width: '100%' }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex justify-center items-center"
                                    transition={{ duration: 0.3 }}
                                >
                                    <span>{t('clear-cache.confirm')}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </MotionButton>

                {/* Cancel button */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: areYouSure ? 'auto' : 0 }}
                    exit={{ width: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                >
                    <AnimatePresence>
                        {areYouSure && (
                            <MotionButton
                                layout
                                variant="outline"
                                onClick={() => setAreYouSure(false)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {t('clear-cache.cancel')}
                            </MotionButton>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};
