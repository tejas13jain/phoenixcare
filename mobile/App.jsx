import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator.jsx';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}
