import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheItem {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class CacheService {
  private readonly prefix = "@coin_cache_";

  // Save data to cache with expiration
  async set(key: string, data: any, expiresIn: number = 5 * 60 * 1000) {
    try {
      const cacheItem: CacheItem = {
        data,
        timestamp: Date.now(),
        expiresIn,
      };
      await AsyncStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  // Get data from cache
  async get(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.prefix}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem = JSON.parse(cached);
      const now = Date.now();
      const age = now - cacheItem.timestamp;

      // Return data even if expired (stale-while-revalidate)
      return {
        data: cacheItem.data,
        isExpired: age > cacheItem.expiresIn,
        age,
      };
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  // Check if cache exists and is valid
  async has(key: string): Promise<boolean> {
    const cached = await this.get(key);
    return cached !== null;
  }

  // Clear specific cache
  async clear(key: string) {
    try {
      await AsyncStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  // Clear all cache
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Cache clear all error:", error);
    }
  }
}

export default new CacheService();
