import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';
import { NavigationLibraryType, PendoSDK } from 'rn-pendo-sdk';

import App from './App';

const VISITOR_ID_KEY = 'clearlist-visitor-id';

// Pendo must be set up before the app renders. Clearlist has no navigation
// library, so screens are not tracked automatically.
PendoSDK.setup('914bf832-d43f-4a52-b3c8-d221b194b4eb', {
  library: NavigationLibraryType.Other,
});

// Clearlist has no user accounts, so each install gets a random visitor ID
// that is kept in AsyncStorage alongside the saved tasks.
async function getVisitorId() {
  const savedId = await AsyncStorage.getItem(VISITOR_ID_KEY);
  if (savedId) return savedId;

  const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(VISITOR_ID_KEY, newId);
  return newId;
}

// If storage is unavailable, an empty visitor ID starts an anonymous session.
getVisitorId()
  .catch(() => '')
  .then((visitorId) => PendoSDK.startSession(visitorId, '', {}, {}));

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
