const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: path.resolve(__dirname, 'out/extension.js'),
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.bundle.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    'vscode': 'commonjs vscode'
  },
  resolve: {
    extensions: ['.js']
  },
  node: {
    __dirname: false
  }
};

