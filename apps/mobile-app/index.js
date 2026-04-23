require('expo-router/entry');

const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
setBackgroundMessageHandler(getMessaging(), async () => {
  // OS handles notification display automatically
});
