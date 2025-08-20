const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const webpack = require("webpack");
const { resolve } = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
const ExtensionReloader = require("webpack-extension-reloader");
const RemovePlugin = require("remove-files-webpack-plugin");
const packageJson = require("./package.json");
const { getProcessEnv } = require("@namada/config/webpack.js");

// Load .env from namadillo:
require("dotenv").config({ path: "./.env" });

const { NODE_ENV, TARGET, BUNDLE_ANALYZE, BETA_RELEASE: isBeta } = process.env;

const OUTPUT_PATH = resolve(__dirname, `./build/${TARGET}`);
const MANIFEST_VERSION = TARGET === "firefox" ? "v2" : "v3";
const MANIFEST_BASE_PATH = `./src/manifest/_base.json`;
const MANIFEST_BASE_VERSION_PATH = `./src/manifest/${MANIFEST_VERSION}/_base.json`;
const MANIFEST_PATH = `./src/manifest/${MANIFEST_VERSION}/${TARGET}.json`;
const MANIFEST_V2_DEV_ONLY_PATH = `./src/manifest/v2/_devOnly.json`;
const GENERATED_MANIFEST = "generatedManifest.json";

// Sets manifest.json fields at build time
function generateManifest(buffer) {
  const manifest = JSON.parse(buffer.toString());

  manifest.name = `${manifest.name}${isBeta ? " BETA" : ""}`;
  manifest.description =
    isBeta ? "THIS EXTENSION IS FOR BETA TESTING" : manifest.description;
  manifest.version = packageJson.version;

  return JSON.stringify(manifest, null, 2);
}

const copyPatterns = [
  {
    from: "../../node_modules/@namada/sdk/dist/sdk.namada.wasm",
    to: "./sdk.namada.wasm",
  },
  {
    from: "./src/public/*.html",
    to: "./[name].html",
  },
  {
    from: "./src/public/*.css",
    to: "./assets/[name].css",
  },
  {
    from: "./src/public/fonts/*",
    to: "./assets/fonts/[name][ext]",
  },
  {
    from: "./src/public/icons/*.png",
    to: "./assets/icons/[name].png",
  },
  {
    from: "./src/public/images/*",
    to: "./assets/images/[name][ext]",
  },
  // browser-polyfill expects a source-map
  {
    from: "../../node_modules/webextension-polyfill/dist/browser-polyfill.js.map",
    to: "./browser-polyfill.js.map",
  },
  {
    from: MANIFEST_BASE_PATH,
    to: GENERATED_MANIFEST,
    transform: generateManifest,
  },
];

const analyzePlugins =
  BUNDLE_ANALYZE === "true" ? [new BundleAnalyzerPlugin()] : [];

const plugins = [
  ...analyzePlugins,
  new CopyPlugin({
    patterns: copyPatterns,
  }),
  new MergeJsonWebpackPlugin({
    files: [
      GENERATED_MANIFEST,
      MANIFEST_BASE_VERSION_PATH,
      MANIFEST_PATH,
      ...(NODE_ENV === "development" && TARGET === "firefox" ?
        [MANIFEST_V2_DEV_ONLY_PATH]
      : []),
    ],
    output: {
      fileName: "./manifest.json",
    },
  }),
  new webpack.ProvidePlugin({
    Buffer: ["buffer", "Buffer"],
  }),
  // Provide environment variables to extension:
  new webpack.DefinePlugin({
    process: {
      env: JSON.stringify(
        getProcessEnv("NAMADA_INTERFACE", [
          "TARGET",
          "NODE_ENV",
          "npm_package_version",
        ])
      ),
    },
  }),
  new RemovePlugin({
    after: {
      include: [`${OUTPUT_PATH}/${GENERATED_MANIFEST}`],
      log: false,
    },
  }),
];

if (NODE_ENV === "development") {
  plugins.push(
    new ExtensionReloader({
      port: 9999,
      reloadPage: true,
      entries: {
        contentScript: ["content"],
        background: ["background"],
        extensionPage: ["popup", "setup", "approvals"],
      },
    })
  );
}

module.exports = {
  mode: NODE_ENV,
  target: "webworker",
  devtool:
    NODE_ENV === "development" && TARGET === "firefox" ?
      "eval-source-map"
    : false,
  entry: {
    content: "./src/content",
    background: "./src/background",
    popup: "./src/App",
    setup: "./src/Setup",
    approvals: "./src/Approvals",
    injected: "./src/content/injected.ts",
  },
  output: {
    publicPath: "",
    path: OUTPUT_PATH,
    //TODO: this might lead to problems with caching
    filename: "[name].namada.js",
    chunkFilename: "[id].[contenthash].js",
    hashFunction: "xxhash64",
  },
  module: {
    rules: [
      // This is needed for webpack to resolve "../../.." in workerHelpers.js
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          happyPackMode: false, // Ensure single-threaded processing
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: require.resolve("@svgr/webpack"),
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: {
                plugins: [{ removeViewBox: false }],
              },
              titleProp: true,
              ref: true,
            },
          },
          {
            loader: require.resolve("file-loader"),
            options: {
              name: "assets/[name].[hash].[ext]",
            },
          },
        ],
        issuer: {
          and: [/\.(ts|tsx|md)$/],
        },
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: require.resolve("file-loader"),
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: [resolve(__dirname, "src/"), "node_modules"],
    fallback: {
      buffer: require.resolve("buffer/"),
      crypto: false,
    },
    plugins: [
      new TsconfigPathsPlugin({
        configFile: "tsconfig.json",
      }),
    ],
  },
  performance: {
    hints: "warning",
    maxAssetSize: 200000,
    maxEntrypointSize: 400000,
    assetFilter: function (assetFilename) {
      assetFilename.endsWith(".wasm");
    },
  },
  plugins,
  stats: {
    // We want to ignore wasm-bindgen-rayon circular dependency warning
    warningsFilter: [/dependency between chunks.+wasm-bindgen-rayon/],
  },
  optimization: {
    moduleIds: "deterministic", // Ensures consistent module IDs
    chunkIds: "deterministic", // Ensures consistent chunk IDs
  },
};
