import CopyPlugin from 'copy-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { HtmlWebpackSkipAssetsPlugin } from 'html-webpack-skip-assets-plugin';
import path from 'path';
import webpack from 'webpack';

const config: webpack.Configuration = {
  mode: 'production',
  entry: {
    popup: ['./src/popup.tsx'],
    background: './src/service-workers/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'popup.html',
      skipAssets: ['background.*', (asset) => asset.attributes && asset.attributes['x-skip']],
    }),
    new HtmlWebpackSkipAssetsPlugin({
      skipAssets: ['background.*', (asset) => asset.attributes && asset.attributes['x-skip']],
    }),
    new CopyPlugin({
      patterns: [{ from: 'public' }],
    }),
    new Dotenv(),
  ],
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};

export default config;
