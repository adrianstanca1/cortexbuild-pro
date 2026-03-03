module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@nozbe/watermelondb-babel-plugin'],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@contexts': './src/contexts',
          '@database': './src/database',
          '@utils': './src/utils',
          '@theme': './src/theme',
          '@types': './src/types',
        },
      },
    ],
  ],
};
