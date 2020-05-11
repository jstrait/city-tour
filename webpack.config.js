const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV,
  entry: ["./src/app/app.js"],
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
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      { from: "city_tour.html" },
      { from: "css/city_tour.css" },
      { from: "lib/*.js" },
    ], { copyUnmodified: true }),
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
