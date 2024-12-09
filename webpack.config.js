const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    popup: "./src/popup/index.tsx",
    content: "./src/content/content.tsx",
    background: "./src/background/background.ts",
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/[name][ext]",
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".mjs"],
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      process: require.resolve("process/browser.js"),
      vm: false,
    },
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.REACT_APP_SERVER_URL': JSON.stringify('http://localhost:3000'),
      'process.env.REACT_APP_AUTH_TOKEN': JSON.stringify('mouaadtester'),
      'process.env.REACT_APP_WEBHOOK_SECRET': JSON.stringify('whsec_7+5jw5tofgW2wYlWDTjFHrhaLcZVWzoU'),
      'process.env.CLERK_PUBLISHABLE_KEY': JSON.stringify('pk_test_bWVycnktZHJhZ29uLTk0LmNsZXJrLmFjY291bnRzLmRldiQ'),
      'process.env.REACT_APP_CLERK_SECRET_KEY': JSON.stringify('whsec_7+5jw5tofgW2wYlWDTjFHrhaLcZVWzoU'),
      'process.env': JSON.stringify(process.env),
    }),
    new HtmlWebpackPlugin({
      template: "./src/popup/popup.html",
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "assets", to: "assets" },
      ],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser.js",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
