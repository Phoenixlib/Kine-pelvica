/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const config = {
  // Configure alias for Turbopack (development)
  turbopack: {
    resolveAlias: {
      react: "./src/sanity/react-shim.js",
    },
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^react$/,
        /** @param {any} resource */
        (resource) => {
          if (
            resource.context &&
            (resource.context.includes("node_modules/sanity") ||
              resource.context.includes("node_modules/@sanity") ||
              resource.context.includes("node_modules/@portabletext"))
          ) {
            resource.request = path.resolve(__dirname, "src/sanity/react-shim.js");
          }
        }
      )
    );
    return config;
  },
};

export default config;

