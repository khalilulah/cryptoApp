import { NoConnection } from "@/components/NoConnection";
import { PriceChart } from "@/components/PriceChart";
import { useTheme } from "@/theme";
import { useNetworkStatus } from "@/useNetworkStatus";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import coinGeckoService from "../services/coinGeckoService";

const SingleCoin = () => {
  const { wp, theme, hp } = useTheme();
  const params = useLocalSearchParams();
  const { isConnected } = useNetworkStatus();
  const [timeoutError, setTimeoutError] = useState(false);
  // Handle both string and array cases
  const coinId = Array.isArray(params.coinId)
    ? params.coinId[0]
    : params.coinId;

  const [coin, setCoin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onRetry = () => {
    fetchCoin();
  };

  useEffect(() => {
    if (coinId) {
      fetchCoin();
    }
  }, [coinId]);

  const fetchCoin = async () => {
    setTimeoutError(false);
    // Timeout handler
    const timeout = setTimeout(() => {
      setTimeoutError(true);
      setLoading(false);
    }, 7000);
    try {
      setLoading(true);
      setError(null);

      const result = await coinGeckoService.getCoinById(coinId, {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
      });

      if (result.success) {
        setCoin(result.data);
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Fetch error:", error.message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  if (!isConnected && error) {
    return <NoConnection onRetry={onRetry} />;
  }

  if (error) {
    return <NoConnection onRetry={onRetry} />;
  }
  if (timeoutError && loading) {
    return (
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <Text style={{ marginBottom: 10 }}>
          Failed to fetch data. Please check your connection.
        </Text>
        <TouchableOpacity onPress={onRetry}>
          <Text
            style={{
              marginBottom: 10,
              fontFamily: theme.fonts.poppins.regular,
            }}
          >
            Reload
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text
          style={[
            {
              fontFamily: theme.fonts.clash.medium,
              fontSize: theme.fontSize.sm,
              color: theme.colors.ligthText,
            },
            styles.loadingText,
          ]}
        >
          Loading coin details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!isConnected && !coin) {
    return <NoConnection onRetry={onRetry} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.clash.medium,
                  fontSize: theme.fontSize.md,
                }}
              >
                {coin.name}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.poppins.medium,
                  fontSize: theme.fontSize.md,
                  paddingLeft: 4,
                }}
              >
                {`(${coin.symbol?.toUpperCase()})`}
              </Text>
            </View>

            <Image
              source={{ uri: coin.image?.large }}
              style={{ width: wp(7), height: wp(7), marginBottom: 12 }}
            />
          </View>

          <View>
            <Text
              style={{
                fontFamily: theme.fonts.poppins.bold,
                fontSize: theme.fontSize.xl,
              }}
            >
              ${coin.market_data?.current_price?.usd?.toLocaleString()}
            </Text>
            <Text
              style={[
                {
                  fontFamily: theme.fonts.poppins.regular,
                  fontSize: theme.fontSize.sm,
                },
                coin.market_data?.price_change_percentage_24h >= 0
                  ? styles.positiveChange
                  : styles.negativeChange,
              ]}
            >
              {coin.market_data?.price_change_percentage_24h >= 0 ? "+" : ""}
              {coin.market_data?.price_change_percentage_24h?.toFixed(2)}% (24h)
            </Text>
          </View>
        </View>
        <PriceChart coinId={coinId} />
        {/* Price Section */}

        {/* Market Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.ligthText,
              }}
            >
              Market Cap
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.md,
              }}
            >
              ${coin.market_data?.market_cap?.usd?.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.ligthText,
              }}
            >
              24h Volume
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.md,
              }}
            >
              ${coin.market_data?.total_volume?.usd?.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.ligthText,
              }}
            >
              24h High
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.md,
              }}
            >
              ${coin.market_data?.high_24h?.usd?.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.ligthText,
              }}
            >
              24h Low
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.md,
              }}
            >
              ${coin.market_data?.low_24h?.usd?.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.ligthText,
              }}
            >
              Market Cap Rank
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.md,
              }}
            >
              #{coin.market_cap_rank}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.ligthText,
              }}
            >
              Circulating Supply
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.md,
              }}
            >
              {coin.market_data?.circulating_supply?.toLocaleString()}{" "}
              {coin.symbol?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        {coin.description?.en && (
          <View>
            <Text
              style={{
                fontFamily: theme.fonts.clash.medium,
                fontSize: theme.fontSize.lg,
                marginBottom: 10,
              }}
            >
              About {coin.name}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.poppins.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.ligthText,
              }}
            >
              {coin.description.en.replace(/<[^>]*>/g, "").substring(0, 300)}...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SingleCoin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContent: {
    padding: 16,
  },

  positiveChange: {
    color: "#16a34a",
  },
  negativeChange: {
    color: "#dc2626",
  },
  statsContainer: {
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },

  loadingText: {
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
