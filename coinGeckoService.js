import { COINGECKO_CONFIG } from "./api";
console.log(COINGECKO_CONFIG);

class CoinGeckoService {
  constructor() {
    this.baseURL = COINGECKO_CONFIG.BASE_URL;
    this.apiKey = COINGECKO_CONFIG.API_KEY;
  }

  // Helper method to build URL with API key
  buildURL(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);

    // Add API key as query parameter
    url.searchParams.append(COINGECKO_CONFIG.DEMO_PARAM, this.apiKey);

    // Add other parameters
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  // Generic fetch method with error handling
  async fetchData(endpoint, params = {}) {
    try {
      const url = this.buildURL(endpoint, params);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`); // ← Fixed: added ()
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("CoinGecko API Error:", error);
      return { success: false, error: error.message };
    }
  }

  // Test API connection
  async ping() {
    return this.fetchData("/ping");
  }

  // Get list of coins with market data
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

  // Get specific coin data by ID
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

  // Get coin market chart (price history)
  async getCoinMarketChart(coinId, params = {}) {
    const defaultParams = {
      vs_currency: "usd",
      days: "7",
      interval: "daily",
      ...params,
    };
    return this.fetchData(`/coins/${coinId}/market_chart`, defaultParams);
  }
}

export default new CoinGeckoService();
