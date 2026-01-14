import React, { useEffect } from 'react';
import Joyride, { STATUS, CallBackProps } from 'react-joyride';
import { useTutorial } from '../../hooks/useTutorial';
import { useTranslation } from 'react-i18next';

export const TutorialWrapper: React.FC = () => {
    const { run, steps, subscribe, setState, stopTutorial } = useTutorial();
    const { t, i18n } = useTranslation('common');
    const isRtl = i18n.dir() === 'rtl';

    useEffect(() => {
        const unsubscribe = subscribe((state) => {
            setState(state);
        });
        return () => {
            unsubscribe();
        };
    }, [subscribe, setState]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            stopTutorial();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            scrollToFirstStep={true}
            callback={handleJoyrideCallback}
            disableScrolling={false}
            locale={{
                back: t('tutorial.back', 'Back'),
                close: t('tutorial.close', 'Close'),
                last: t('tutorial.last', 'Finish'),
                next: t('tutorial.next', 'Next'),
                skip: t('tutorial.skip', 'Skip'),
            }}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: 'hsl(var(--primary))',
                    backgroundColor: 'hsl(var(--card))',
                    textColor: 'hsl(var(--foreground))',
                    arrowColor: 'hsl(var(--card))',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                },
                tooltipContainer: {
                    textAlign: isRtl ? 'right' : 'left',
                    direction: isRtl ? 'rtl' : 'ltr',
                },
                buttonNext: {
                    borderRadius: 'var(--radius)',
                    padding: '8px 16px',
                },
                buttonBack: {
                    marginRight: isRtl ? 0 : 10,
                    marginLeft: isRtl ? 10 : 0,
                    color: 'hsl(var(--muted-foreground))',
                },
                buttonSkip: {
                    color: 'hsl(var(--muted-foreground))',
                },
                buttonClose: {
                    left: isRtl ? 0 : 'unset',
                    right: isRtl ? 'unset' : 0,
                    color: 'hsl(var(--muted-foreground))',
                },
            }}
        />
    );
};
