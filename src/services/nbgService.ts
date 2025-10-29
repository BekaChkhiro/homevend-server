import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * NBG (National Bank of Georgia) Exchange Rate Service
 * Fetches and caches USD to GEL exchange rates from NBG API
 */

export interface ExchangeRate {
  code: string; // "USD"
  quantity: number; // 1
  rate: number; // 2.7241
  rateFormated: string; // "2.7241"
  name: string; // "აშშ დოლარი"
  date: string; // "2025-10-24T17:01:14.199Z"
  validFromDate: string; // "2025-10-25T00:00:00.000Z"
}

export interface NBGApiResponse {
  currencies: ExchangeRate[];
  date: string;
}

export interface CachedRateData {
  usdToGel: number; // e.g., 2.7241
  gelToUsd: number; // e.g., 0.3671 (calculated)
  lastUpdated: string; // ISO date string
  validFrom: string;
  fetchedAt: string; // When we fetched it
}

class NBGService {
  private readonly NBG_API_URL = 'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json/';
  private readonly CACHE_FILE = path.join(process.cwd(), 'data', 'exchange_rates.json');
  private readonly CACHE_TTL_HOURS = 24; // Refresh daily
  private readonly FALLBACK_RATE = 2.72; // Fallback if API fails

  private cachedRate: CachedRateData | null = null;
  private fetchPromise: Promise<CachedRateData> | null = null;

  constructor() {
    // Ensure data directory exists
    this.ensureDataDirectory();

    // Load cached rate on startup
    this.loadCachedRate().catch(err => {
      console.error('Failed to load cached exchange rate:', err);
    });
  }

  /**
   * Ensure data directory exists for storing cache
   */
  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  /**
   * Load cached rate from file
   */
  private async loadCachedRate(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.CACHE_FILE, 'utf-8');
      this.cachedRate = JSON.parse(fileContent);
      console.log('✅ Loaded cached exchange rate:', {
        usdToGel: this.cachedRate?.usdToGel,
        lastUpdated: this.cachedRate?.lastUpdated
      });
    } catch (error) {
      console.log('📝 No cached exchange rate found, will fetch from NBG API');
      this.cachedRate = null;
    }
  }

  /**
   * Save rate to cache file
   */
  private async saveCachedRate(rate: CachedRateData): Promise<void> {
    try {
      await this.ensureDataDirectory();
      await fs.writeFile(this.CACHE_FILE, JSON.stringify(rate, null, 2), 'utf-8');
      console.log('💾 Saved exchange rate to cache');
    } catch (error) {
      console.error('Failed to save exchange rate cache:', error);
    }
  }

  /**
   * Check if cached rate is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cachedRate) return false;

    const now = new Date();
    const fetchedAt = new Date(this.cachedRate.fetchedAt);
    const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);

    return hoursSinceFetch < this.CACHE_TTL_HOURS;
  }

  /**
   * Fetch current rate from NBG API
   */
  private async fetchFromNBG(date?: Date): Promise<CachedRateData> {
    try {
      // Format date as YYYY-MM-DD (use today if not specified)
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];

      const url = `${this.NBG_API_URL}?date=${dateStr}`;
      console.log(`🔄 Fetching exchange rate from NBG API: ${url}`);

      const response = await axios.get<ExchangeRate[]>(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HomeVend/1.0'
        },
        timeout: 10000 // 10 second timeout
      });

      const data: ExchangeRate[] = response.data;

      // Find USD rate
      const usdRate = data.find((currency: ExchangeRate) => currency.code === 'USD');

      if (!usdRate) {
        throw new Error('USD rate not found in NBG API response');
      }

      const cachedData: CachedRateData = {
        usdToGel: usdRate.rate,
        gelToUsd: 1 / usdRate.rate, // Calculate inverse
        lastUpdated: usdRate.date,
        validFrom: usdRate.validFromDate,
        fetchedAt: new Date().toISOString()
      };

      // Save to cache
      await this.saveCachedRate(cachedData);
      this.cachedRate = cachedData;

      console.log(`✅ Fetched exchange rate from NBG: 1 USD = ${cachedData.usdToGel} GEL`);

      return cachedData;
    } catch (error) {
      console.error('❌ Failed to fetch from NBG API:', error);
      throw error;
    }
  }

  /**
   * Get current exchange rate (with caching)
   */
  async getCurrentRate(): Promise<CachedRateData> {
    // Return cached rate if valid
    if (this.isCacheValid()) {
      console.log('📦 Using cached exchange rate');
      return this.cachedRate!;
    }

    // If already fetching, wait for that promise
    if (this.fetchPromise) {
      console.log('⏳ Waiting for ongoing fetch...');
      return this.fetchPromise;
    }

    // Fetch new rate
    this.fetchPromise = this.fetchFromNBG()
      .catch((error) => {
        console.error('Failed to fetch new rate, using fallback or cached rate');

        // Use cached rate even if expired, or fallback
        if (this.cachedRate) {
          console.warn('⚠️ Using expired cached rate due to fetch failure');
          return this.cachedRate;
        }

        console.warn('⚠️ Using fallback rate:', this.FALLBACK_RATE);
        return {
          usdToGel: this.FALLBACK_RATE,
          gelToUsd: 1 / this.FALLBACK_RATE,
          lastUpdated: new Date().toISOString(),
          validFrom: new Date().toISOString(),
          fetchedAt: new Date().toISOString()
        };
      })
      .finally(() => {
        this.fetchPromise = null;
      });

    return this.fetchPromise;
  }

  /**
   * Get rate for a specific date (for historical conversions)
   */
  async getRateForDate(date: Date): Promise<CachedRateData> {
    try {
      return await this.fetchFromNBG(date);
    } catch (error) {
      console.error(`Failed to fetch rate for date ${date.toISOString()}:`, error);

      // Fallback to current rate
      return this.getCurrentRate();
    }
  }

  /**
   * Force refresh rate from API
   */
  async refreshRate(): Promise<CachedRateData> {
    console.log('🔄 Force refreshing exchange rate...');
    this.cachedRate = null; // Invalidate cache
    return this.getCurrentRate();
  }

  /**
   * Get cached rate without fetching (returns null if no cache)
   */
  getCachedRate(): CachedRateData | null {
    return this.cachedRate;
  }

  /**
   * Convert USD to GEL
   */
  async convertUsdToGel(usdAmount: number): Promise<number> {
    const rate = await this.getCurrentRate();
    return usdAmount * rate.usdToGel;
  }

  /**
   * Convert GEL to USD
   */
  async convertGelToUsd(gelAmount: number): Promise<number> {
    const rate = await this.getCurrentRate();
    return gelAmount * rate.gelToUsd;
  }
}

// Export singleton instance
export const nbgService = new NBGService();

// Export class for testing
export default NBGService;
