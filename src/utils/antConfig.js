const isdark = true;
import { BorderOutlined } from "@ant-design/icons";
import { theme } from "antd";

export const antConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgBase: "#171717",
    colorPrimary: isdark ? "#FF6D00" : "#FF6D00",
    borderRadius: 8,
    fontSize: 16,
    // Adding DM Sans font family
    fontFamily:
      "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    colorTextSecondary: "#FF6D89",
    // Adding success and error colors
    colorSuccess: "#22C55E",
    colorError: "#EF4444",
    // Support colors for success and error states
    colorSuccessBg: "rgba(34, 197, 94, 0.1)",
    colorSuccessBorder: "rgba(34, 197, 94, 0.3)",
    colorErrorBg: "rgba(239, 68, 68, 0.1)",
    colorErrorBorder: "rgba(239, 68, 68, 0.3)",
  },
  components: {
    Typography: {
      colorSecondary: "#FF6D89",
      // Adding DM Sans font family
      fontFamily:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    },

    Button: {
      // Customizing the large button
      controlHeightLG: 52,
      paddingInlineLG: 24,
      fontSizeLG: 16,
      // Adding DM Sans font family
      fontFamily:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      colorPrimary: "#FF6D00",
      colorPrimaryHover: "#FF8124",
      colorPrimaryActive: "#E66300",
      // Disabled button customization
      colorBgContainerDisabled: "#ff6d005c",
      colorBorderDisabledk: "#ff6d005c",
    },
    Input: {
      colorPrimary: "#FF6D00",
      colorPrimaryHover: "#FF8124",
      colorPrimaryActive: "#E66300",
      // Adding DM Sans font family
      fontFamily:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      // Customizing the large input
      controlHeightLG: 52,
      paddingInlineLG: 16,
      fontSizeLG: 16,
      colorBgContainer: "#171717",
      colorBorder: "#373737",
    },
    Select: {
      colorPrimary: "#FF6D00",
      colorPrimaryHover: "#FF8124",
      colorPrimaryActive: "#E66300",
      // Adding DM Sans font family
      fontFamily:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      // Customizing the large select
      controlHeightLG: 52,
      multipleItemHeightLG: 32,
      paddingInlineLG: 16,
      fontSizeLG: 16,
      optionFontSizeLG: 16,
      colorBgContainer: "#171717",
      colorBorder: "#373737",
    },
    Form: {
      // Removing required mark
      requiredMarkFontSize: 0,
      // Success and error states for form items
      colorSuccessBorder: "#22C55E",
      colorErrorBorder: "#EF4444",
    },
    Result: {
      // Adding success and error colors for Result component
      colorSuccess: "#22C55E",
      colorError: "#EF4444",
    },
    Alert: {
      // Adding success and error colors for Alert component
      colorSuccessBg: "rgba(34, 197, 94, 0.1)",
      colorSuccessBorder: "rgba(34, 197, 94, 0.3)",
      colorErrorBg: "rgba(239, 68, 68, 0.1)",
      colorErrorBorder: "rgba(239, 68, 68, 0.3)",
    },
    Message: {
      // Adding success and error colors for Message component
      colorSuccess: "#22C55E",
      colorError: "#EF4444",
    },
    Notification: {
      // Adding success and error colors for Notification component
      colorSuccess: "#22C55E",
      colorError: "#EF4444",
    },

    Modal: {
      // Modal header and footer styles
      titleFontSize: 20,
      headerBg: "#1E1E1E",
      contentBg: "#1E1E1E",
      footerBg: "#1E1E1E",

      // colorBgMask: "rgba(0, 0, 234, 0.75)",
    },
    ColorPicker: {
      // ColorPicker configuration
      controlHeightLG: 52,
      fontSizeLG: 16,
      colorBgContainer: "#171717",
      colorBorder: "#373737",
      colorPrimary: "#FF6D00",
      colorPrimaryHover: "#FF8124",
      colorPrimaryActive: "#E66300",
      // Customize color picker panel
      panelBg: "#1E1E1E",
      panelInputBg: "#171717",
      colorTextLabel: "#AAAAAA",
      // Customize color picker trigger
      colorPickerInsetShadow: "none",
      // Text settings
      colorPickerTextColor: "#FFFFFF",
      colorPickerInsetShadowSize: 0,
    },
    DatePicker: {
      // Customizing the large date picker
      controlHeightLG: 52,
      paddingInlineLG: 16,
      fontSizeLG: 16,
      colorPrimary: "#FF6D00",
      colorPrimaryHover: "#FF8124",
      colorPrimaryActive: "#E66300",
      colorBgContainer: "#171717",
      colorBorder: "#373737",
      // Date picker panel customization
      colorBgElevated: "#1E1E1E",
      colorTextHeading: "#FFFFFF",
      colorTextDisabled: "#666666",
      colorTextPlaceholder: "#888888",
      colorIcon: "#AAAAAA",
      colorIconHover: "#FF6D00",
      // Selected date cell styling
      cellActiveWithRangeBg: "rgba(255, 109, 0, 0.1)",
      cellHoverWithRangeBg: "rgba(255, 109, 0, 0.05)",
      cellRangeBorderColor: "#FF6D00",
      // Adding DM Sans font family
      fontFamily:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    },
    TimePicker: {
      // Customizing the large time picker
      controlHeightLG: 52,
      paddingInlineLG: 16,
      fontSizeLG: 16,
      colorPrimary: "#FF6D00",
      colorPrimaryHover: "#FF8124",
      colorPrimaryActive: "#E66300",
      colorBgContainer: "#171717",
      colorBorder: "#373737",
      // Time picker panel customization
      colorBgElevated: "#1E1E1E",
      colorTextHeading: "#FFFFFF",
      colorTextDisabled: "#666666",
      colorTextPlaceholder: "#888888",
      colorIcon: "#AAAAAA",
      colorIconHover: "#FF6D00",
      // Adding DM Sans font family
      fontFamily:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    },
  },
};
