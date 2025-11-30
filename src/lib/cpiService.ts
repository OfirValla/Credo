import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface CPIEntry {
    year: number;
    month: number;
    monthDesc: string;
    percent: number;
    percentYear: number;
    currBase: {
        baseDesc: string;
        value: number;
    };
}

export interface CPIResponse {
    month: {
        code: number;
        name: string;
        date: CPIEntry[];
    }[];
    paging?: {
        total_items: number;
        page_size: number;
        current_page: number;
        last_page: number;
        next_url: string | null;
    };
}

export interface CPIData {
    [year: string]: {
        [month: string]: number;
    };
}

export const CPI_STORAGE_KEY = 'cpi_data';
export const LAST_FETCH_KEY = 'cpi_last_fetch';
const BASE_API_URL = 'https://api.cbs.gov.il/index/data/price?id=120010&format=json&download=false&PageSize=100';

export const fetchAndStoreCPIData = async () => {
    try {
        let allEntries: CPIEntry[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`${BASE_API_URL}&Page=${currentPage}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: CPIResponse = await response.json();

            if (data.month && data.month.length > 0 && data.month[0].date) {
                allEntries = [...allEntries, ...data.month[0].date];
            }

            if (data.paging && data.paging.next_url) {
                currentPage++;
            } else {
                hasMore = false;
            }

            // Safety break to prevent infinite loops if API behaves unexpectedly
            if (currentPage > 50) {
                hasMore = false;
            }
        }

        if (allEntries.length > 0) {
            const formattedData: CPIData = {};

            allEntries.forEach(entry => {
                const yearStr = entry.year.toString();
                const monthStr = entry.month.toString().padStart(2, '0');

                if (!formattedData[yearStr]) {
                    formattedData[yearStr] = {};
                }

                // Storing the index value
                formattedData[yearStr][monthStr] = entry.currBase.value;
            });

            localStorage.setItem(CPI_STORAGE_KEY, JSON.stringify(formattedData));
            localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString());
            console.log(`CPI Data updated successfully. Fetched ${allEntries.length} entries.`);
        }
    } catch (error) {
        console.error('Failed to fetch CPI data:', error);
    }
};

export const shouldFetchCPI = (currentDate: Date, lastFetchDate: Date | null): boolean => {
    if (!lastFetchDate) {
        return true;
    }

    // Determine the target fetch date for the current month
    // If today is before the 16th, we expect the data from the previous month to be available (published on the 15th usually)
    // But actually, the requirement is "recollected on the 16th of each month".
    // This implies that on the 16th, we should check for new data.
    // So if today >= 16th, we want to ensure we have fetched AFTER the 16th of this month.
    // If today < 16th, we want to ensure we have fetched AFTER the 16th of the PREVIOUS month.

    let targetFetchDate: Date;

    if (currentDate.getDate() >= 16) {
        targetFetchDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 16);
    } else {
        // Go back to previous month
        targetFetchDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 16);
    }

    // If our last fetch was before the target fetch date, we need to fetch again.
    return lastFetchDate < targetFetchDate;
};

export const checkAndUpdateCPI = () => {
    const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
    const now = new Date();
    const lastFetchDate = lastFetch ? new Date(lastFetch) : null;

    if (shouldFetchCPI(now, lastFetchDate)) {
        console.log('Fetching CPI data...');
        fetchAndStoreCPIData();
    }
};

export const useCPI = (): CPIData => {
    const [cpiData] = useLocalStorage<CPIData>(CPI_STORAGE_KEY, {});
    return cpiData;
};