import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { FeedbackForm } from '@/components/forms/FeedbackForm';

export function Feedback() {
    const { t } = useTranslation('common');

    return (
        <div className="container max-w-2xl mx-auto p-4 md:p-8 pt-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {t('feedback.title')}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        {t('feedback.intro')}
                    </p>
                </div>

                <FeedbackForm />
            </motion.div>
        </div>
    );
}

export default Feedback;
