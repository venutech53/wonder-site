import localFont from "next/font/local";

export const roboto = localFont({
  src: [
    { path: "../public/fonts/roboto/Roboto-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/roboto/Roboto-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/roboto/Roboto-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/roboto/Roboto-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/roboto/Roboto-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-roboto",
  display: "swap",
});

export const homemadeApple = localFont({
  src: "../public/fonts/homemade-apple/HomemadeApple-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-homemade-apple",
  display: "swap",
});
