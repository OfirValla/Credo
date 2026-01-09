import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";

export interface FeedbackData {
    type: string;
    message: string;
    email?: string;
    timestamp?: number;
}

export const feedbackService = {
    async sendFeedback(data: FeedbackData) {
        const feedbacksRef = ref(database, 'feedbacks');
        const payload = {
            ...data,
            timestamp: Date.now()
        };
        console.log(payload);
        const cleanPayload = Object.fromEntries(
            Object.entries(payload).filter(([, v]) => v !== undefined && v !== null)
        );
        console.log(cleanPayload);
        await push(feedbacksRef, cleanPayload);
    }
};
