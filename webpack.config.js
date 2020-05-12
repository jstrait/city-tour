const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV,
  entry: ["./src/app/app.js", "./css/city_tour.css"],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
        ],
      }
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({terserOptions: { compress: true, mangle: true }}),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      { from: "city_tour.html" },
      { from: "lib/*.js" },
    ], { copyUnmodified: true }),
    new MiniCssExtractPlugin({
      filename: "city_tour.css",
    }),
    new TerserPlugin({
      terserOptions: {
        compress: true,
        mangle: true,
      },
    }),
  ],
  output: {
    filename: "city_tour.js",
    path: path.resolve(__dirname, "./dist"),
  }
};
