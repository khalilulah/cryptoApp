import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface NoConnectionProps {
  onRetry: () => void;
}

export const NoConnection: React.FC<NoConnectionProps> = ({ onRetry }) => {
  const { wp, theme } = useTheme();
  return (
    <View style={localStyles.container}>
      <Ionicons
        name="cloud-offline-outline"
        size={wp(15)}
        color={theme.colors.textSecondary}
      />
      <Text
        style={[
          {
            fontFamily: theme.fonts.clash.medium,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          },
          localStyles.title,
        ]}
      >
        No Internet Connection
      </Text>
      <Text
        style={[
          {
            fontFamily: theme.fonts.clash.medium,
            fontSize: theme.fontSize.sm,
            color: theme.colors.ligthText,
          },
          localStyles.text,
        ]}
      >
        Please check your internet connection and try again
      </Text>
      <TouchableOpacity style={localStyles.button} onPress={onRetry}>
        <Text
          style={{
            fontFamily: theme.fonts.clash.medium,
            fontSize: theme.fontSize.sm,
            color: theme.colors.text,
          }}
        >
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    marginBottom: 30,
    paddingHorizontal: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
