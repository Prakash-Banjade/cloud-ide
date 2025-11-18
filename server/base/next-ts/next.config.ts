import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
  |--------------------------------------------------
  | ! Below CORS configuration is set automatically by Qubide, do not modify
  |--------------------------------------------------
  */  
  allowedDevOrigins: ["https://www.qubide.cloud"],
  async headers() {
    return [
      {
        source: "/",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://www.qubide.cloud" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  }, 
};

export default nextConfig;
