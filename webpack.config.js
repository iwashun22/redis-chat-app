const path = require('path');

module.exports = {
   mode: 'production',
   entry: './app/index',
   output: {
      path: path.resolve(__dirname, 'public/javascripts'),
      filename: 'bundle.js'
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
               loader: 'babel-loader',
               options: {
                  presets: ['@babel/preset-env']
               }
            }
         }
      ]
   }
}