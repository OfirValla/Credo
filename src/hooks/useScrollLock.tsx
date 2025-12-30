import { useEffect } from "react";

function useScrollLock(isLocked: boolean) {
    useEffect(() => {
        if (!isLocked) return;

        const controller = new AbortController();
        const signal = controller.signal;

        const preventDefault = (e: Event) => e.preventDefault();

        document.body.addEventListener("wheel", preventDefault, { passive: false, signal });
        document.body.addEventListener("touchmove", preventDefault, { passive: false, signal });

        // Cleanup using AbortController
        return () => {
            controller.abort();
        };
    }, [isLocked]);
}

export { useScrollLock };