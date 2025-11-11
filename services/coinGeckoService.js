import { COINGECKO_CONFIG } from "../api";
import cacheService from "./cacheService";

class CoinGeckoService {
  constructor() {
    this.baseURL = COINGECKO_CONFIG.BASE_URL;
    this.apiKey = COINGECKO_CONFIG.API_KEY;
  }

  buildURL(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    url.searchParams.append(COINGECKO_CONFIG.DEMO_PARAM, this.apiKey);

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  // Enhanced fetch with caching
  async fetchData(endpoint, params = {}, useCache = true) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;

    try {
      // Try to get from cache first
      if (useCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached && cached.data) {
          // Return cached data immediately
          const result = { success: true, data: cached.data, fromCache: true };

          // If cache is expired, fetch fresh data
          if (cached.isExpired) {
            this.fetchFreshData(endpoint, params, cacheKey).catch((err) =>
              console.error("Background fetch error:", err)
            );
          }

          return result;
        }
      }

      //  fetch fresh data
      return await this.fetchFreshData(endpoint, params, cacheKey);
    } catch (error) {
      console.error("CoinGecko API Error:", error);

      // If fetch fails,  return stale cache as fallback
      const cached = await cacheService.get(cacheKey);
      if (cached && cached.data) {
        console.log("Returning stale cache due to fetch error");
        return {
          success: true,
          data: cached.data,
          fromCache: true,
          stale: true,
          error: null,
        };
      }
      return {
        success: false,
        error: error.message,
        data: null,
        fromCache: false,
      };
    }
  }

  // Fetch fresh data and update cache
  async fetchFreshData(endpoint, params, cacheKey) {
    const url = this.buildURL(endpoint, params);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Save to cache (5 minutes for market data, 10 minutes for coin details)
    const expiresIn = endpoint.includes("/markets")
      ? 5 * 60 * 1000
      : 10 * 60 * 1000;
    await cacheService.set(cacheKey, data, expiresIn);

    return { success: true, data, fromCache: false };
  }

  async ping() {
    return this.fetchData("/ping", {}, false);
  }

  async getCoinMarkets(params = {}) {
    const defaultParams = {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 100,
      page: 1,
      sparkline: false,
      ...params,
    };
    return this.fetchData("/coins/markets", defaultParams);
  }

  async getCoinById(coinId, params = {}) {
    const defaultParams = {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      ...params,
    };
    return this.fetchData(`/coins/${coinId}`, defaultParams);
  }

  async getCoinMarketChart(coinId, params = {}) {
    const defaultParams = {
      vs_currency: "usd",
      days: "7",
      ...params,
    };
    return this.fetchData(`/coins/${coinId}/market_chart`, defaultParams);
  }

  // Force refresh (bypass cache)
  async forceRefresh(endpoint, params) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    await cacheService.clear(cacheKey);
    return this.fetchData(endpoint, params, false);
  }
}

export default new CoinGeckoService();
