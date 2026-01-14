import { useState, useCallback } from 'react';
import { Step } from 'react-joyride';

interface TutorialState {
    run: boolean;
    steps: Step[];
}

// Simple event-based system to trigger tutorial from anywhere
const listeners = new Set<(state: TutorialState) => void>();

export const startTutorial = (steps: Step[]) => {
    listeners.forEach(listener => listener({ run: true, steps }));
};

export const stopTutorial = () => {
    listeners.forEach(listener => listener({ run: false, steps: [] }));
};

export const useTutorial = () => {
    const [state, setState] = useState<TutorialState>({ run: false, steps: [] });

    // Subscribe to external triggers
    const subscribe = useCallback((listener: (state: TutorialState) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }, []);

    return {
        ...state,
        setState,
        subscribe,
        startTutorial,
        stopTutorial,
    };
};
