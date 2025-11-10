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
import coinGeckoService from "../../coinGeckoService";
import { NoConnection } from "../../components/NoConnection";

const index = () => {
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

  // Fetch coins on component mount
  useEffect(() => {
    fetchCoins();

    // Set up interval to fetch data every 5 seconds
    intervalRef.current = setInterval(() => {
      if (isMounted.current && !refreshing) {
        fetchCoins(pageNum, true); // Silent refresh (no loading indicator)
      }
    }, 5000); // 5000ms = 5 seconds

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
      // Show all coin
      setCoins(allCoins);
    } else {
      // Filter
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
    // Timeout handler
    const timeout = setTimeout(() => {
      setTimeoutError(true);
      setLoading(false);
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
        setAllCoins(uniqueCoin);

        // Apply search filter if there's a search query
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

        setPageNum(pageNumber);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      if (!silentRefresh) {
        setError(err.message);
      }
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
    fetchCoins();
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

  if (!isConnected && error) {
    return <NoConnection onRetry={onRetry} />;
  }

  if (timeoutError) {
    return (
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <Text style={{ marginBottom: 10 }}>
          Failed to fetch data. Please check your connection.
        </Text>
        <Button title="Reload" onPress={onRetry} />
      </View>
    );
  }

  if (error) {
    return <NoConnection onRetry={onRetry} />;
  }

  if (loading) {
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
        onEndReachedThreshold={0.1}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          coins.length > 0 && searchQuery.length === 0 ? (
            <ActivityIndicator
              style={{ marginVertical: 20 }}
              size="large"
              color={"#0286FF"}
            />
          ) : null
        }
      />
    </View>
  );
};
export default index;

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
  header: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 16,
    backgroundColor: "#fff",
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
  coinName: {
    fontSize: 16,
    fontWeight: "600",
  },
  coinSymbol: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  priceInfo: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
  },
  change: {
    fontSize: 14,
    marginTop: 4,
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
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
  },
  errorHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  noResults: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
