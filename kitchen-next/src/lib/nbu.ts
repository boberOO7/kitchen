/**
 * NBU (National Bank of Ukraine) exchange rate utilities
 * API: https://bank.gov.ua/NBU_Exchange/exchange_site?json
 */

interface NbuRate {
  r030: number;        // Currency code (840 for USD)
  txt: string;         // Currency name
  rate: number;        // Exchange rate
  cc: string;          // Currency code (USD)
  exchangedate: string; // Date in DD.MM.YYYY format
}

export interface ExchangeRateResult {
  rate: number;
  date: string;        // Date from NBU (DD.MM.YYYY)
  dateFormatted: string; // Human-readable date
}

/**
 * Fetch current USD/UAH exchange rate from NBU API
 * Returns the official rate from National Bank of Ukraine
 * 
 * Uses Next.js revalidate for caching (1 hour)
 * @throws Error if rate cannot be fetched
 */
export async function getNbuUsdRate(): Promise<number> {
  const result = await fetchNbuRate();
  return result.rate;
}

/**
 * Fetch NBU rate with full details (rate + date)
 * @throws Error if rate cannot be fetched
 */
async function fetchNbuRate(): Promise<ExchangeRateResult> {
  const response = await fetch(
    "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json",
    {
      next: { revalidate: 3600 }, // Next.js cache for 1 hour
      headers: {
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`NBU API error: ${response.status}`);
  }

  const data: NbuRate[] = await response.json();
  
  if (!data || data.length === 0) {
    throw new Error("No rate data from NBU");
  }

  const nbuData = data[0];
  
  // Parse NBU date (DD.MM.YYYY) to formatted string
  const [day, month, year] = nbuData.exchangedate.split(".");
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const dateFormatted = dateObj.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    rate: nbuData.rate,
    date: nbuData.exchangedate,
    dateFormatted,
  };
}

/**
 * Convert USD cents to UAH kopeks using NBU rate
 * Rounds to whole hryvnias (no kopeks) for cleaner invoices
 * @param usdMinor - Amount in USD cents
 * @param rate - Exchange rate (USD to UAH)
 * @returns Amount in UAH kopeks (rounded to whole hryvnias, i.e. multiples of 100)
 */
export function convertUsdToUah(usdMinor: number, rate: number): number {
  // USD cents * rate = UAH kopeks
  const kopeks = usdMinor * rate;
  // Round to whole hryvnias (100 kopeks = 1 UAH)
  return Math.round(kopeks / 100) * 100;
}

/**
 * Format UAH amount from kopeks to human-readable string (whole hryvnias only)
 * @param kopeks - Amount in kopeks
 * @returns Formatted string like "41 500" (no decimals)
 */
export function formatUahFromMinor(kopeks: number): string {
  const uah = Math.round(kopeks / 100);
  return uah.toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Get exchange rate info for display
 * @throws Error if rate cannot be fetched
 */
export async function getExchangeRateInfo(): Promise<ExchangeRateResult> {
  return fetchNbuRate();
}
