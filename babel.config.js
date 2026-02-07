module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: `.env.${process.env.APP_ENV || 'development'}`, // Use 'development' by default
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
