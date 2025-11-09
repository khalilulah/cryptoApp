import { useTheme } from "@/theme";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { onboarding } from "../welcomeData";

const Welcome = () => {
  const { wp, theme, hp } = useTheme();
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === onboarding.length - 1;
  return (
    <SafeAreaView
      style={{
        display: "flex",
        justifyContent: "center",
        height: "100%",
        alignItems: "center",
        paddingHorizontal: wp(5),
      }}
    >
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        style={{
          width: "100%",
          justifyContent: "flex-end",
          alignItems: "flex-end",
        }}
      >
        <Text style={{ fontFamily: theme.fonts.poppins.semibold }}>Skip</Text>
      </TouchableOpacity>
      <Swiper
        ref={swiperRef}
        loop={false}
        dot={
          <View
            style={{
              width: 15,
              height: 4,
              backgroundColor: "#E2E8F0",
              borderRadius: 2,
              marginHorizontal: 2,
            }}
          />
        }
        activeDot={
          <View
            style={{
              width: 32,
              height: 4,
              backgroundColor: "#0286FF",
              borderRadius: 2,
              marginHorizontal: 2,
            }}
          />
        }
        onIndexChanged={(index) => setActiveIndex(index)}
      >
        {onboarding.map((item) => (
          <View
            key={item.id}
            style={{
              marginVertical: "auto",
              gap: hp(3),
            }}
          >
            <Image
              source={item.image}
              resizeMode="contain"
              style={{ alignSelf: "center" }}
            />
            <View style={{ gap: hp(1) }}>
              <Text
                style={{
                  fontFamily: theme.fonts.poppins.bold,
                  fontSize: theme.fontSize.xxl,
                  textAlign: "center",
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.poppins.regular,
                  textAlign: "center",
                }}
              >
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </Swiper>
      <TouchableOpacity
        onPress={() =>
          isLastSlide
            ? router.replace("/(tabs)")
            : swiperRef.current?.scrollBy(1)
        }
        style={{
          backgroundColor: theme.colors.primary,
          width: wp(80),
          alignItems: "center",
          paddingVertical: wp(3),
          borderRadius: wp(10),
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.poppins.regular,
            color: theme.colors.background,
          }}
        >
          {isLastSlide ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Welcome;
