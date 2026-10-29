import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server only serves its JavaScript to localhost by default. Opening the site from another
  // device on your Wi-Fi (e.g. http://192.168.x.x:3000 on a phone) then loads the HTML but no scripts,
  // so the calendar and other client-side parts stay empty. These patterns allow typical home networks.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
