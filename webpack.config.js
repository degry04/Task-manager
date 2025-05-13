const path = require('path');

     module.exports = {
       mode: 'development',
       entry: './src/index.js',
       output: {
         path: path.resolve(__dirname, 'dist'),
         filename: 'bundle.js'
       },
       devServer: {
         static: path.join(__dirname, 'dist'),
         port: 3000,
         open: true
       },
       module: {
         rules: [
           {
             test: /\.tsx?$/,
             use: 'ts-loader',
             exclude: /node_modules/
           }
         ]
       },
       resolve: {
         extensions: ['.tsx', '.ts', '.js']
       }
     };