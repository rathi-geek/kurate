// Firebase packages are disabled until GoogleService-Info.plist / google-services.json
// are configured. Remove these entries to re-enable Firebase autolinking.
module.exports = {
  dependencies: {
    '@react-native-firebase/app': {
      platforms: { ios: null, android: null },
    },
    '@react-native-firebase/crashlytics': {
      platforms: { ios: null, android: null },
    },
    '@react-native-firebase/messaging': {
      platforms: { ios: null, android: null },
    },
  },
};
