const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'background': './src/background/service-worker.ts',
    'content': './src/content/content-script.ts',
    'popup': './src/popup/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        {
          from: 'public/icons',
          to: 'icons',
          noErrorOnMissing: true
        },
        {
          from: 'src/components/modal.css',
          to: 'modal.css',
          noErrorOnMissing: true
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: 'src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    })
  ]
};
