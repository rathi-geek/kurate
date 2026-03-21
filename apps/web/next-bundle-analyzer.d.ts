declare module "@next/bundle-analyzer" {
  import type { NextConfig } from "next";

  type BundleAnalyzerOptions = {
    enabled?: boolean;
    openAnalyzer?: boolean;
  };

  function withBundleAnalyzer(options: BundleAnalyzerOptions): (config: NextConfig) => NextConfig;

  export default withBundleAnalyzer;
}
