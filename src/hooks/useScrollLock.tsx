import { useEffect } from "react";

function useScrollLock(isLocked: boolean, ref?: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!isLocked) return;

        const controller = new AbortController();
        const signal = controller.signal;

        const preventDefault = (e: Event) => {
            if (ref?.current && (e.target as Node) && ref.current.contains(e.target as Node)) {
                return;
            }
            e.preventDefault();
        };

        document.body.addEventListener("wheel", preventDefault, { passive: false, signal });
        document.body.addEventListener("touchmove", preventDefault, { passive: false, signal });
        document.body.style.overflow = "hidden";

        // Cleanup using AbortController
        return () => {
            controller.abort();
            document.body.style.overflow = "auto";
        };
    }, [isLocked, ref]);
}

export { useScrollLock };