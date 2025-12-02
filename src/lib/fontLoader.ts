/**
 * Fetches the Rubik font (Regular) from a CDN and returns it as a Base64 string.
 * This is required for jsPDF to support Hebrew characters.
 */
export async function loadHebrewFont(): Promise<string> {
    // Fetching from local public directory to avoid CORS/Network issues
    const fontUrl = '/fonts/Rubik-Regular.ttf';

    try {
        const res = await fetch(fontUrl);
        if (!res.ok) throw new Error(`Failed to fetch font: ${res.statusText}`);
        const blob = await res.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // The result is "data:font/ttf;base64,..."
                // We need just the base64 part
                const base64data = reader.result as string;
                const base64 = base64data.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error loading font:', error);
        throw error;
    }
}
