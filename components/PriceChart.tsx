import { useTheme } from "@/theme";
import { useNetworkStatus } from "@/useNetworkStatus";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import coinGeckoService from "../services/coinGeckoService";
import { NoConnection } from "./NoConnection";

const { width } = Dimensions.get("window");

interface PriceChartProps {
  coinId: string;
}

interface ChartDataCache {
  [key: string]: {
    data: any[];
    priceChange: number;
    timestamp: number;
  };
}

export const PriceChart: React.FC<PriceChartProps> = ({ coinId }) => {
  const { wp, theme, hp } = useTheme();
  const [chartDataCache, setChartDataCache] = useState<ChartDataCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [prefetching, setPrefetching] = useState(false);
  const { isConnected } = useNetworkStatus();
  const [timeoutError, setTimeoutError] = useState(false);

  const periods = [
    { label: "1D", value: "1" },
    { label: "7D", value: "7" },
    { label: "30D", value: "30" },
    { label: "90D", value: "90" },
    { label: "1Y", value: "365" },
  ];

  // Prefetch all periods on mount
  useEffect(() => {
    prefetchAllPeriods();
  }, [coinId]);

  const onRetry = () => {
    prefetchAllPeriods();
  };

  // Prefetch data for all periods
  const prefetchAllPeriods = async () => {
    setLoading(false);
    setError(null);
    setTimeoutError(false);

    try {
      // Fetch all periods in parallel
      const fetchPromises = periods.map((period) =>
        fetchChartDataForPeriod(period.value)
      );

      const results = await Promise.allSettled(fetchPromises);

      const newCache: ChartDataCache = {};
      let successCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          const period = periods[index].value;
          newCache[period] = result.value;
          successCount++;
        }
      });

      if (successCount > 0) {
        setChartDataCache(newCache);
      } else {
        setError("Failed to load chart data");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Chart prefetch error:", err);
    } finally {
      setLoading(false);
      setPrefetching(false);
    }
  };

  // Fetch chart data for a specific period
  const fetchChartDataForPeriod = async (days: string) => {
    try {
      const result = await coinGeckoService.getCoinMarketChart(coinId, {
        vs_currency: "usd",
        days: days,
      });

      if (result.success && result.data.prices) {
        // Format data for the chart
        const formattedData = result.data.prices.map(
          ([timestamp, price]: [number, number]) => ({
            x: new Date(timestamp),
            y: price,
          })
        );

        // Calculate price change
        let priceChange = 0;
        if (formattedData.length > 0) {
          const firstPrice = formattedData[0].y;
          const lastPrice = formattedData[formattedData.length - 1].y;
          priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        }

        return {
          data: formattedData,
          priceChange,
          timestamp: Date.now(),
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching ${days} day chart:`, err);
      return null;
    }
  };

  // Background refresh for current period
  const refreshCurrentPeriod = async () => {
    if (!isConnected) return;

    setPrefetching(true);
    const newData = await fetchChartDataForPeriod(selectedPeriod);

    if (newData) {
      setChartDataCache((prev) => ({
        ...prev,
        [selectedPeriod]: newData,
      }));
    }
    setPrefetching(false);
  };

  // Auto-refresh every 30 seconds for current period (optional)
  useEffect(() => {
    if (!chartDataCache[selectedPeriod]) return;

    const interval = setInterval(() => {
      refreshCurrentPeriod();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedPeriod, isConnected]);

  const renderChart = () => {
    const currentData = chartDataCache[selectedPeriod];
    if (!currentData || currentData.data.length === 0) return null;

    const chartData = currentData.data;
    const chartWidth = width - 64;
    const chartHeight = 200;
    const padding = { top: 10, bottom: 30, left: 10, right: 10 };

    // Get min and max prices
    const prices = chartData.map((d) => d.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Create path points
    const points = chartData.map((d, i) => {
      const x =
        padding.left +
        (i / (chartData.length - 1)) *
          (chartWidth - padding.left - padding.right);
      const y =
        padding.top +
        chartHeight -
        padding.bottom -
        ((d.y - minPrice) / priceRange) *
          (chartHeight - padding.top - padding.bottom);
      return { x, y };
    });

    // Create SVG path
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }

    // Create area path (for gradient fill)
    let areaPath = pathData;
    areaPath += ` L ${points[points.length - 1].x} ${
      chartHeight - padding.bottom
    }`;
    areaPath += ` L ${points[0].x} ${chartHeight - padding.bottom}`;
    areaPath += " Z";

    const isPositive = currentData.priceChange >= 0;
    const strokeColor = isPositive ? "#16a34a" : "#dc2626";
    const gradientId = isPositive ? "greenGradient" : "redGradient";

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#16a34a" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#16a34a" stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#dc2626" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#dc2626" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y =
            padding.top +
            (i / 4) * (chartHeight - padding.top - padding.bottom);
          return (
            <Line
              key={i}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#e0e0e0"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Area fill */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <Path d={pathData} stroke={strokeColor} strokeWidth="2" fill="none" />

        {/* Price labels */}
        {[0, 2, 4].map((i) => {
          const priceAtY = maxPrice - (i / 4) * priceRange;
          const y =
            padding.top +
            (i / 4) * (chartHeight - padding.top - padding.bottom);
          return (
            <SvgText
              key={i}
              x={chartWidth - padding.right + 5}
              y={y + 4}
              fontSize="10"
              fill="#666"
            >
              $
              {priceAtY.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </SvgText>
          );
        })}
      </Svg>
    );
  };

  // Get loading status for each period
  const isPeriodLoaded = (value: string) => {
    return !!chartDataCache[value];
  };

  // if (loading && Object.keys(chartDataCache).length === 0) {
  //   return (
  //     <View style={styles.centered}>
  //       <ActivityIndicator size="large" color="#0066cc" />
  //       <Text style={styles.loadingText}>Loading chart data...</Text>
  //       <Text style={styles.subText}>Fetching all periods...</Text>
  //     </View>
  //   );
  // }

  if (!isConnected && Object.keys(chartDataCache).length === 0) {
    return <NoConnection onRetry={onRetry} />;
  }

  if (timeoutError && Object.keys(chartDataCache).length === 0) {
    return (
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <Text
          style={{ marginBottom: 10, fontFamily: theme.fonts.poppins.regular }}
        >
          Something went wrong
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

  if (error && Object.keys(chartDataCache).length === 0) {
    return <NoConnection onRetry={onRetry} />;
  }

  const currentData = chartDataCache[selectedPeriod];
  const isPositive = currentData ? currentData.priceChange >= 0 : false;
  const priceChange = currentData ? currentData.priceChange : 0;

  return (
    <View style={{ marginVertical: 20 }}>
      {/* Prefetching indicator */}
      {prefetching && (
        <View style={styles.prefetchIndicator}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.prefetchText}>Updating...</Text>
        </View>
      )}

      {/* Price Change Indicator */}
      <View style={{ alignSelf: "flex-end" }}>
        <Text
          style={{
            fontFamily: theme.fonts.clash.medium,
            fontSize: theme.fontSize.md,
          }}
        >
          {selectedPeriod} Day Change
        </Text>
        <Text
          style={[
            {
              fontFamily: theme.fonts.clash.medium,
              fontSize: theme.fontSize.md,
            },
            isPositive ? styles.positiveChange : styles.negativeChange,
          ]}
        >
          {isPositive ? "+" : ""}
          {priceChange.toFixed(2)}%
        </Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {currentData ? (
          renderChart()
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#0066cc" />
            <Text
              style={[
                styles.subText,
                {
                  fontFamily: theme.fonts.clash.medium,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.ligthText,
                },
              ]}
            >
              Loading {selectedPeriod}D chart...
            </Text>
          </View>
        )}
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => {
          const isLoaded = isPeriodLoaded(period.value);
          const isActive = selectedPeriod === period.value;

          return (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                isActive && styles.periodButtonActive,
                !isLoaded && styles.periodButtonLoading,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
              disabled={!isLoaded}
            >
              {!isLoaded ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <Text
                  style={[
                    {
                      fontFamily: theme.fonts.clash.medium,
                      fontSize: theme.fontSize.sm,
                    },
                    isActive && styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Offline indicator */}
      {!isConnected && Object.keys(chartDataCache).length > 0 && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>Showing cached data (offline)</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
  },
  subText: {
    marginTop: 4,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  positiveChange: {
    color: "#16a34a",
  },
  negativeChange: {
    color: "#dc2626",
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 10,
    minHeight: 200,
    justifyContent: "center",
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  periodButtonActive: {
    backgroundColor: "#0066cc",
  },
  periodButtonLoading: {
    backgroundColor: "#f9f9f9",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  periodButtonTextActive: {
    color: "#fff",
  },
  prefetchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    marginBottom: 12,
  },
  prefetchText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#0066cc",
  },
  offlineIndicator: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    alignItems: "center",
  },
  offlineText: {
    fontSize: 12,
    color: "#856404",
  },
});
