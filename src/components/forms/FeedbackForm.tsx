import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Bug, Lightbulb, MessageSquare, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { feedbackService } from '@/services/feedbackService';

export interface FeedbackFormProps {
    onSuccess?: () => void;
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
    const { t } = useTranslation('common');
    const [type, setType] = useState('bug');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (email.trim() && !emailRegex.test(email.trim())) {
            toast.error(t('feedback.email.error') || 'Please enter a valid email address');
            setIsSubmitting(false);
            return;
        }

        try {
            await feedbackService.sendFeedback({
                type,
                message,
                email: email.trim() || undefined
            });

            toast.success(t('feedback.success'));
            setSubmitted(true);
            setMessage('');
            setEmail('');

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to send feedback:', error);
            toast.error(t('feedback.error') || 'Failed to send feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeIcon = (t: string) => {
        switch (t) {
            case 'bug': return <Bug className="w-4 h-4" />;
            case 'feature': return <Lightbulb className="w-4 h-4" />;
            default: return <MessageSquare className="w-4 h-4" />;
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
            >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{t('feedback.success')}</h3>
                <p className="text-muted-foreground mb-6">Your input helps us build a better product.</p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                    Send another
                </Button>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
                <label className="text-sm font-medium leading-none">
                    {t('feedback.type.label')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {['bug', 'feature', 'other'].map((tType) => (
                        <div
                            key={tType}
                            className={`
                                cursor-pointer rounded-xl border-2 p-4 text-center transition-all hover:bg-accent/50
                                ${type === tType
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-muted bg-card hover:border-primary/50'}
                            `}
                            onClick={() => setType(tType)}
                        >
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className={`p-2 rounded-full ${type === tType ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {getTypeIcon(tType)}
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {t(`feedback.type.${tType}`)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium leading-none flex justify-between">
                    <span>{t('feedback.message.label')}</span>
                    <span className="text-xs text-muted-foreground">
                        {message.length}/1024
                    </span>
                </label>
                <textarea
                    className="flex min-h-[150px] w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y shadow-sm"
                    placeholder={t('feedback.message.placeholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={1024}
                    required
                />
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium leading-none">
                    {t('feedback.email.label')}
                </label>
                <div className="relative flex items-center">
                    <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="email"
                        placeholder={t('feedback.email.placeholder')}
                        className="pl-9 h-11 rounded-xl bg-background/50 shadow-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                disabled={isSubmitting || !message.trim()}
            >
                {isSubmitting ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center"
                    >
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                    </motion.div>
                ) : (
                    <span className="flex items-center">
                        {t('feedback.submit')}
                        <Send className="w-4 h-4 ml-2" />
                    </span>
                )}
            </Button>
        </form>
    );
}
