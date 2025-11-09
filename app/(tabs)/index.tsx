import { useNetworkStatus } from "@/useNetworkStatus";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import coinGeckoService from "../../coinGeckoService";
import { NoConnection } from "../../components/NoConnection";

const index = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const isMounted = useRef(true);
  const intervalRef = useRef<number | null>(null);

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
                new Set([...coins, ...result.data].map((coin) => coin.id))
              ).map((id) =>
                [...coins, ...result.data].find((coin) => coin.id === id)
              );

        setCoins(uniqueCoin);
        setPageNum(pageNumber);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      if (!silentRefresh) {
        setError(err.message);
      }
    } finally {
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
    fetchCoins();
  };

  const renderCoinItem = ({ item }: { item: any }) => (
    <View style={styles.coinItem}>
      <Image source={{ uri: item.image }} style={styles.coinImage} />
      <View style={styles.coinInfo}>
        <Text style={styles.coinName}>{item.name}</Text>
        <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
      </View>
      <View style={styles.priceInfo}>
        <Text style={styles.price}>${item.current_price.toLocaleString()}</Text>
        <Text
          style={[
            styles.change,
            item.price_change_percentage_24h >= 0
              ? styles.positiveChange
              : styles.negativeChange,
          ]}
        >
          {item.price_change_percentage_24h >= 0 ? "+" : ""}
          {item.price_change_percentage_24h?.toFixed(2)}%
        </Text>
      </View>
    </View>
  );

  if (!isConnected) {
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

  // if (error) {
  //   return (
  //     <View style={styles.centered}>
  //       <Text style={styles.errorText}>Something went wrong</Text>
  //       <TouchableOpacity style={styles.errorHint} onPress={onRetry}>
  //         <Text>try again</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Crypto Prices</Text>
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
          coins.length > 0 ? (
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
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
});
