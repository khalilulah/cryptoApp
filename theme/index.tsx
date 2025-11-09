import { PixelRatio, useWindowDimensions } from "react-native";

// Always get current dimensions dynamically

export const useTheme = () => {
  const { width, height } = useWindowDimensions();

  const wp = (percentage: number) => (width * percentage) / 100;
  const hp = (percentage: number) => (height * percentage) / 100;

  const getBaseWidth = () => {
    if (width >= 1024) return 1440; // desktop
    if (width >= 768) return 1024; // tablet
    return 375; // mobile
  };

  const normalize = (size: number) => {
    const baseWidth = getBaseWidth();
    const scale = width / baseWidth;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const theme = {
    colors: {
      primary: "#0286FF",
      secondary: "#E2E8F0",
      background: "#FFFFFF",
      text: "#FFFFFF",
      textSecondary: "#000000",
      ligthText: "#808080",
      gradient1: "#FBB03B",
      gradient2: "#EC0C43",
      viewIcon: "#FFA821",
      border: "#0000001A",
      navBorder: "#E5E5E5",
      ActiveBackground: "#C8FFBD",
      ActiveText: "#1BA400",
    },

    spacing: {
      xs: wp(1),
      sm: wp(2),
      md: wp(4),
      lg: wp(6),
      xl: wp(8),
    },

    fontSize: {
      xxxs: normalize(6.22), //Random
      xxs: normalize(10.22), // ~12px
      xs: normalize(11.93), // ~14px
      sm: normalize(13.64), // ~16px
      md: normalize(15.34), // ~18px
      lg: normalize(17.05), // ~20px
      xl: normalize(20.45), // ~24px
      xxl: normalize(27.27), // ~32px
      sxxl: normalize(40.9), // ~32px
      xxxl: normalize(51.13), // ~64px
    },

    widthSize: {
      xs: normalize(11.93), // ~14px
      sm: normalize(13.64), // ~16px
      md: normalize(15.34), // ~18px
      lg: normalize(17.05), // ~20px
      xl: normalize(20.45), // ~24px
      xxl: normalize(27.27), // ~32px
      xxxl: normalize(742.47), // ~870px
    },

    iconSizes: {
      xs: wp(0.69), // ~10px
      sm: wp(1.11), // ~16px
      md: wp(1.66), // ~24px
      lg: wp(2.22), // ~32px
      xl: wp(3.33), // ~48px
    },

    fonts: {
      poppins: {
        regular: "Poppins-Regular",
        medium: "Poppins-Medium",
        semibold: "Poppins-SemiBold",
        bold: "Poppins-Bold",
      },
      clash: {
        medium: "ClashDisplay-Medium",
      },
    },
  };
  return { theme, normalize, wp, hp };
};
