import coinGeckoService from "@/coinGeckoService";
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
import { NoConnection } from "./NoConnection";

const { width } = Dimensions.get("window");

interface PriceChartProps {
  coinId: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ coinId }) => {
  const { wp, theme, hp } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [priceChange, setPriceChange] = useState(0);
  const { isConnected } = useNetworkStatus();

  const periods = [
    { label: "1D", value: "1" },
    { label: "7D", value: "7" },
    { label: "30D", value: "30" },
    { label: "90D", value: "90" },
    { label: "1Y", value: "365" },
  ];

  useEffect(() => {
    fetchChartData();
  }, [coinId, selectedPeriod]);

  const onRetry = () => {
    fetchChartData();
  };
  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await coinGeckoService.getCoinMarketChart(coinId, {
        vs_currency: "usd",
        days: selectedPeriod,
      });

      if (result.success && result.data.prices) {
        // Format data for the chart
        const formattedData = result.data.prices.map(
          ([timestamp, price]: [number, number]) => ({
            x: new Date(timestamp),
            y: price,
          })
        );

        setChartData(formattedData);

        // Calculate price change
        if (formattedData.length > 0) {
          const firstPrice = formattedData[0].y;
          const lastPrice = formattedData[formattedData.length - 1].y;
          const change = ((lastPrice - firstPrice) / firstPrice) * 100;
          setPriceChange(change);
        }
      } else {
        setError("Failed to load chart data");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Chart fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

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

    const isPositive = priceChange >= 0;
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }

  if (!isConnected && error) {
    return <NoConnection onRetry={onRetry} />;
  }

  if (error) {
    return <NoConnection onRetry={onRetry} />;
  }

  const isPositive = priceChange >= 0;

  return (
    <View style={{ marginVertical: 20 }}>
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
      <View style={styles.chartContainer}>{renderChart()}</View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.periodButton,
              selectedPeriod === period.value && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.value)}
          >
            <Text
              style={[
                {
                  fontFamily: theme.fonts.clash.medium,
                  fontSize: theme.fontSize.sm,
                },
                selectedPeriod === period.value &&
                  styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },

  periodLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  priceChangeText: {
    fontSize: 24,
    fontWeight: "bold",
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
  },
  periodButtonActive: {
    backgroundColor: "#0066cc",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  periodButtonTextActive: {
    color: "#fff",
  },
});
