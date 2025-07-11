const autoprefixer = require('autoprefixer')
const postcssCssnano = require('cssnano')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const LodashWebpackPlugin = require('lodash-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const _loader = MiniCssExtractPlugin.loader
const postcssPresetEnv = require('postcss-preset-env')
const { minify: _minify } = require('uglify-js')
const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally')

const hostFiles = [
	'/app_src/lib/jam/jamHelpers.jsxinc',
	'/app_src/lib/jam/jamActions.jsxinc',
	'/app_src/lib/jam/jamStyles.jsxinc',
	'/app_src/lib/jam/jamEngine.jsxinc',
	'/app_src/lib/jam/jamUtils.jsxinc',
	'/app_src/lib/jam/jamText.jsxinc',
	'/app_src/lib/jam/jamJSON.jsxinc',
	'/app_src/host.js',
].map((file) => `${__dirname}${file}`)

const defaultConfig = {
	entry: {
		index: ['./app_src/index.jsx'],
	},
	output: {
		path: `${__dirname}/app/`,
		filename: 'index.js',
		publicPath: './',
	},
	resolve: {
		extensions: ['.js', '.jsx', '.jsxinc'],
	},
}

const devConfig = {
	mode: 'development',
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						plugins: ['lodash'],
					},
				},
			},
			{
				test: /\.css$/,
				use: {
					loader: 'file-loader',
				},
			},
			{
				test: /\.scss$/,
				use: [
					{
						loader: _loader,
					},
					{
						loader: 'css-loader',
						options: {
							sourceMap: true,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							sourceMap: true,
							postcssOptions: {
								plugins: [postcssPresetEnv(), autoprefixer()],
							},
						},
					},
					{
						loader: 'sass-loader',
						options: {
							sourceMap: true,
						},
					},
				],
			},
			{
				test: /\.(gif|png|jpe?g|svg)$/,
				loader: 'file-loader',
			},
			{
				test: /\.(woff|woff2|eot|otf|ttf)?$/,
				loader: 'base64-inline-loader',
			},
		],
	},
	plugins: [
		new LodashWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: './app_src/index.html',
			filename: 'index.html',
		}),
		new MiniCssExtractPlugin(),
		new MergeIntoSingleFilePlugin({
			files: {
				'host.jsx': hostFiles,
			},
		}),
	],
}

const prodConfig = {
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						plugins: ['lodash'],
					},
				},
			},
			{
				test: /\.css$/,
				use: {
					loader: 'file-loader',
				},
			},
			{
				test: /\.scss$/,
				use: [
					{
						loader: _loader,
					},
					{
						loader: 'css-loader',
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [postcssPresetEnv(), postcssCssnano(), autoprefixer()],
							},
						},
					},
					{
						loader: 'sass-loader',
					},
				],
			},
			{
				test: /\.(gif|png|jpe?g|svg)$/,
				loader: 'file-loader',
			},
			{
				test: /\.(woff|woff2|eot|otf|ttf)?$/,
				loader: 'base64-inline-loader',
			},
		],
	},
	plugins: [
		new LodashWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: './app_src/index.html',
			filename: 'index.html',
			minify: {
				removeStyleLinkTypeAttributes: true,
				removeScriptTypeAttributes: true,
				collapseBooleanAttributes: true,
				removeEmptyAttributes: true,
				removeAttributeQuotes: true,
				collapseWhitespace: true,
				removeComments: true,
			},
		}),
		new MiniCssExtractPlugin(),
		new MergeIntoSingleFilePlugin({
			files: {
				'host.jsx': hostFiles,
			},
			transform: {
				'host.jsx': (code) => {
					const res = _minify(code, {
						output: { beautify: true, indent_level: 0, quote_keys: true },
						compress: false,
					})
					return res.code
						.replace(/([{};:,])\s*\n+\s*/gi, '$1')
						.replace(/\s*\n+\s*([})\];:,])/gi, '$1')
				},
			},
		}),
	],
}

function clientConfig(_, argv) {
	const envConfig = argv.mode === 'development' ? devConfig : prodConfig
	return Object.assign({}, defaultConfig, envConfig)
}

module.exports = [clientConfig]
