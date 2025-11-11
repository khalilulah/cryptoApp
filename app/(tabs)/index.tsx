import { useTheme } from "@/theme";
import { useNetworkStatus } from "@/useNetworkStatus";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NoConnection } from "../../components/NoConnection";
import coinGeckoService from "../../services/coinGeckoService";

const CoinListScreen = () => {
  const { theme, wp, hp } = useTheme();
  const { isConnected } = useNetworkStatus();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const isMounted = useRef(true);
  const intervalRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allCoins, setAllCoins] = useState([]);
  const [timeoutError, setTimeoutError] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Fetch coins on component mount
  useEffect(() => {
    fetchCoins();

    // Set up interval to fetch data every 5 seconds
    intervalRef.current = setInterval(() => {
      if (isMounted.current && !refreshing) {
        fetchCoins(pageNum, true);
      }
    }, 5000);

    // Cleanup function
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const onRetry = () => {
    fetchCoins();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (text.trim() === "") {
      setCoins(allCoins);
    } else {
      const searchResults = allCoins.filter(
        (item: any) =>
          item.name.toLowerCase().includes(text.toLowerCase()) ||
          item.symbol.toLowerCase().includes(text.toLowerCase())
      );
      setCoins(searchResults);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCoins(allCoins);
  };

  // Update interval when pageNum changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (isMounted.current && !refreshing) {
          fetchCoins(pageNum, true);
        }
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pageNum]);

  const fetchCoins = async (pageNumber = 1, silentRefresh = false) => {
    setTimeoutError(false);

    // Don't show loading if we have cached data
    if (allCoins.length === 0 && !silentRefresh) {
      setLoading(true);
    }

    const timeout = setTimeout(() => {
      if (allCoins.length === 0) {
        setTimeoutError(true);
        setLoading(false);
      }
    }, 10000);

    try {
      if (!silentRefresh) {
        setError(null);
      }

      const result = await coinGeckoService.getCoinMarkets({
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 10,
        page: pageNumber,
        sparkline: false,
        price_change_percentage: "24h",
      });

      if (result.success) {
        const uniqueCoin =
          refreshing || pageNumber === 1
            ? result.data
            : Array.from(
                new Set([...allCoins, ...result.data].map((coin) => coin.id))
              ).map((id) =>
                [...allCoins, ...result.data].find((coin) => coin.id === id)
              );

        // Only update if data is different (prevents unnecessary re-renders)
        if (JSON.stringify(allCoins) !== JSON.stringify(uniqueCoin)) {
          setAllCoins(uniqueCoin);

          //  search filter
          if (searchQuery.trim() !== "") {
            const filtered = uniqueCoin.filter(
              (item: any) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setCoins(filtered);
          } else {
            setCoins(uniqueCoin);
          }
        }

        setPageNum(pageNumber);
        setFromCache(result.fromCache || false);
      }
    } catch (err: any) {
      if (!silentRefresh && allCoins.length === 0) {
        setError(err.message);
      }
      console.log("Fetch error:", err.message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!loading && !refreshing) {
      await fetchCoins(pageNum + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    setPageNum(1);
    fetchCoins(1);
  };

  const renderCoinItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/SinglrCoin",
          params: {
            coinId: item.id,
          },
        })
      }
      style={[styles.coinItem, { borderBottomColor: theme.colors.secondary }]}
    >
      <Image source={{ uri: item.image }} style={styles.coinImage} />
      <View style={styles.coinInfo}>
        <Text
          style={{
            fontFamily: theme.fonts.clash.medium,
            fontSize: theme.fontSize.md,
          }}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.clash.medium,
            fontSize: theme.fontSize.sm,
            color: theme.colors.ligthText,
          }}
        >
          {item.symbol.toUpperCase()}
        </Text>
      </View>
      <View style={styles.priceInfo}>
        <Text
          style={{
            fontFamily: theme.fonts.clash.medium,
            fontSize: theme.fontSize.md,
          }}
        >
          ${item.current_price.toLocaleString()}
        </Text>
        <Text
          style={[
            {
              fontFamily: theme.fonts.poppins.regular,
              fontSize: theme.fontSize.sm,
            },
            item.price_change_percentage_24h >= 0
              ? styles.positiveChange
              : styles.negativeChange,
          ]}
        >
          {item.price_change_percentage_24h >= 0 ? "+" : ""}
          {item.price_change_percentage_24h?.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!isConnected && allCoins.length === 0) {
    return <NoConnection onRetry={onRetry} />;
  }

  if (timeoutError && loading && allCoins.length === 0) {
    return (
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <Text style={{ marginBottom: 10 }}>Something went wrong</Text>
        <Button title="Reload" onPress={onRetry} />
      </View>
    );
  }

  if (error && allCoins.length === 0) {
    return <NoConnection onRetry={onRetry} />;
  }

  if (loading && allCoins.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading crypto data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SEARCH BAR */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.background,
          borderRadius: wp(6),
          paddingHorizontal: wp(4),
          marginVertical: hp(2),
          borderWidth: 1,
          borderColor: theme.colors.border,
          minHeight: hp(6),
          width: wp(90),
          alignSelf: "center",
        }}
      >
        <Ionicons
          name="search"
          size={wp(5)}
          color={theme.colors.textSecondary}
        />
        <TextInput
          style={{
            flex: 1,
            marginLeft: wp(2.5),
            fontSize: wp(4),
            color: theme.colors.primary,
            fontFamily: theme.fonts.clash.medium,
          }}
          placeholder={"search for coin"}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons
              name="close-circle"
              size={wp(5)}
              color={theme.colors.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* No results message */}
      {searchQuery.length > 0 && coins.length === 0 && (
        <View style={styles.noResults}>
          <Text
            style={{
              fontFamily: theme.fonts.poppins.regular,
              fontSize: theme.fontSize.sm,
              textAlign: "center",
            }}
          >
            No coins found for "{searchQuery}"
          </Text>
        </View>
      )}

      <FlatList
        data={coins}
        renderItem={renderCoinItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.1}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          !isConnected ? (
            <View style={{ display: "flex", alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: theme.fonts.poppins.regular,
                  fontSize: theme.fontSize.sm,
                  textAlign: "center",
                }}
              >
                check your interet connection
              </Text>
              <TouchableOpacity
                style={{
                  padding: 10,
                  backgroundColor: "#0286FF",
                  alignItems: "center",
                  borderRadius: 100,
                }}
                onPress={onRetry}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.poppins.regular,
                    fontSize: theme.fontSize.sm,
                    textAlign: "center",
                    color: theme.colors.text,
                  }}
                >
                  Reload
                </Text>
              </TouchableOpacity>
            </View>
          ) : coins.length > 0 && searchQuery.length === 0 ? (
            <ActivityIndicator
              style={{ marginVertical: 20 }}
              size="large"
              color={"#0286FF"}
            />
          ) : null
        }
        ListEmptyComponent={
          searchQuery.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text
                style={{
                  marginBottom: 10,
                  fontFamily: theme.fonts.poppins.regular,
                  fontSize: theme.fontSize.sm,
                  textAlign: "center",
                }}
              >
                Failed to fetch data. Please check your connection.
              </Text>
              <TouchableOpacity onPress={onRetry}>
                <Text
                  style={{
                    fontFamily: theme.fonts.poppins.regular,
                    fontSize: theme.fontSize.sm,
                    textAlign: "center",
                  }}
                >
                  Reload
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default CoinListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cacheIndicator: {
    backgroundColor: "#fff3cd",
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: "center",
  },
  cacheText: {
    fontSize: 12,
    color: "#856404",
    fontWeight: "500",
  },
  coinItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 8,
    borderBottomWidth: 1,
  },
  coinImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  coinInfo: {
    flex: 1,
    marginLeft: 12,
  },
  priceInfo: {
    alignItems: "flex-end",
  },
  positiveChange: {
    color: "#16a34a",
  },
  negativeChange: {
    color: "#dc2626",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  noResults: {
    padding: 20,
    alignItems: "center",
  },
});
