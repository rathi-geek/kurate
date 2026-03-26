import { AppState, AppStateStatus, FlatList } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { getQuoteHistory, initializeBackgroundTask, Quote } from '@/utils';
import { useEffect, useRef, useState } from 'react';
// import * as TaskManager from 'expo-task-manager';

// debugging
// TaskManager.getRegisteredTasksAsync().then(tasks => {
//   console.log('Registered tasks:', tasks);
// });

let resolver: (() => void) | null;
const promise = new Promise<void>(resolve => {
  resolver = resolve;
});

initializeBackgroundTask(promise);

export default function BackgroundTaskScreen() {
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const appState = useRef(AppState.currentState);
  console.log('quoteHistory length', quoteHistory.length);
  useEffect(() => {
    if (resolver) {
      resolver();
    }
    loadQuoteHistory();

    const appStateChange = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('App has come to the foreground!');
          loadQuoteHistory();
        }
        if (appState.current.match(/active/) && nextAppState === 'background') {
          console.log('App has gone to the background!');
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      appStateChange.remove();
      console.log('App state change listener removed');
    };
  }, []);

  const loadQuoteHistory = async () => {
    const history = await getQuoteHistory();
    if (history) {
      setQuoteHistory(history);
    }
  };
  return (
    <View style={{ flex: 1 }} className="bg-background">
      <Text className="text-foreground">
        Quote History length : {quoteHistory.length}
      </Text>
      <FlatList
        data={quoteHistory}
        renderItem={({ item }: { item: Quote }) => (
          <View className="mb-4 rounded-md p-4">
            <Text className="text-foreground">{item.q}</Text>
          </View>
        )}
      />
    </View>
  );
}
