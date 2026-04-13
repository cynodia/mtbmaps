const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

function gitInfo() {
    try {
        const version = execSync('git describe --always --tags', { encoding: 'utf8' }).trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        return version + "/" + branch;
    } catch (e) {
        return 'unknown';
    }
}

const appVersion = gitInfo();
console.log("Version: " + appVersion);

module.exports = {
    entry: {
        app: './src/app.js'
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                { from: 'index.html' },
                { from: 'index_mobile.html' },
                { from: 'favicon.ico' },
                { from: 'lib', to: 'lib' },
                { from: 'html', to: 'html' },
                { from: 'data', to: 'data' }
            ],
        }),
        new webpack.DefinePlugin({
            BUILD_version: JSON.stringify(appVersion),
            BUILD_buildDate: JSON.stringify((new Date()).toISOString().substr(0, 19)),
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
        new webpack.ProvidePlugin({
            $: ['jquery', '$'],
            jQuery: ['jquery', 'jQuery'],
        }),
    ],
    output: {
        filename: 'mtbmaps.[name].min.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/",
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(woff(2)?|ttf|eot)(\?.*)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext]'
                }
            }
        ]
    },
};