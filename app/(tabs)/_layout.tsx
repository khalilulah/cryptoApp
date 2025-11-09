import { Tabs } from "expo-router";

import "react-native-reanimated";

const Layout = () => {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ headerShown: false }} />
    </Tabs>
  );
};

export default Layout;
