const path = require('path');

module.exports = {
  entry: './maze-main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  devServer: {
    static: {
      directory: __dirname,
    },
    compress: true,
    port: 9000,
    hot: true,
  },
  optimization: {
    minimize: true,
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
    }
  }
};