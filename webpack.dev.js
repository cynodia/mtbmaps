const merge = require('webpack-merge')
const common = require('./webpack.config.js')
const webpack = require('webpack')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
          new webpack.DefinePlugin({
            CONFIG_buildType: JSON.stringify("DEBUG")
          })
  ],
  devServer: {
    contentBase: './dist',
    hot: true,
    port: 8080,
    open: false,
    overlay: true
  },
});