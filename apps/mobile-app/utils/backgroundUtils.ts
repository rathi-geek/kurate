import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_TASK_IDENTIFIER = 'fetch-quote-task';
const MINIMUM_INTERVAL = 15; // This is 15 minutes without which default is 12 hrs
const QUOTES_HISTORY_KEY = '@quotes_history';
const MAX_HISTORY_ITEMS = 10;

export type Quote = {
  q: string;
  a: string;
  c: string;
  h: string;
  timestamp: number;
};

type QuoteHistory = Quote[];

export const initializeBackgroundTask = async (
  innerAppMountedPromise: Promise<void>,
) => {
  console.log('Initializing background task');
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    console.log('Background task started');
    // wait for the inner app to be mounted
    await innerAppMountedPromise;
    console.log('Inner app mounted');
    // fetch a new quote
    try {
      const response = await fetch('https://zenquotes.io/api/random');
      const quotes: Quote[] = await response.json();
      console.log('Quotes fetched:', quotes);
      if (quotes && quotes.length > 0) {
        await storeQuoteHistory(quotes[0]);
        console.log('Quote stored');
      }
    } catch (error) {
      console.log('Error fetching quote:', error);
    }
    // save it to local storage

    console.log('Background task completed');
  });
  if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER))) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
      minimumInterval: MINIMUM_INTERVAL,
    });
  }
};

export const getQuoteHistory = async (): Promise<QuoteHistory | null> => {
  try {
    const historyJson = await AsyncStorage.getItem(QUOTES_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : null;
  } catch (error) {
    console.error('Error getting quote history:', error);
    return null;
  }
};

async function storeQuoteHistory(quote: Quote) {
  try {
    const historyJson = await AsyncStorage.getItem(QUOTES_HISTORY_KEY);
    const history: QuoteHistory = historyJson ? JSON.parse(historyJson) : [];

    const newQuote = {
      ...quote,
      timestamp: Date.now(),
    };

    const updatedHistory = [newQuote, ...history].slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(
      QUOTES_HISTORY_KEY,
      JSON.stringify(updatedHistory),
    );
  } catch (error) {
    console.error('Error storing quote history:', error);
  }
}
