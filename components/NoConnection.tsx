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
      <Text style={localStyles.title}>No Internet Connection</Text>
      <Text style={localStyles.text}>
        Please check your internet connection and try again
      </Text>
      <TouchableOpacity style={localStyles.button} onPress={onRetry}>
        <Text style={localStyles.buttonText}>Retry</Text>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
