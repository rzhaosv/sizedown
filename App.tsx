import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, type } from './src/theme';
import { AppProvider, useApp } from './src/store/AppContext';
import { RootStackParamList, TabParamList } from './src/navigation';
import TabIcon from './src/components/TabIcon';
import { PrimaryButton } from './src/components/UI';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TodayScreen from './src/screens/TodayScreen';
import JournalScreen from './src/screens/JournalScreen';
import RulesScreen from './src/screens/RulesScreen';
import EvalsScreen from './src/screens/EvalsScreen';
import MeScreen from './src/screens/MeScreen';
import LogTradeScreen from './src/screens/LogTradeScreen';
import TradeScreen from './src/screens/TradeScreen';
import NewEvalScreen from './src/screens/NewEvalScreen';
import EvalScreen from './src/screens/EvalScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { demo } from './src/dev/demo';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const navTheme: Theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.surface, text: colors.ink, primary: colors.accent, border: colors.line } };
const ICON: Record<keyof TabParamList, 'tables' | 'people' | 'pairs' | 'chats' | 'you'> = { Today: 'tables', Journal: 'chats', Rules: 'people', Evals: 'pairs', Me: 'you' };

function Tabs() {
  const initial = demo ? ({ today: 'Today', trade: 'Today', journal: 'Journal', rules: 'Rules', eval: 'Evals', me: 'Me', paywall: 'Today', onboard: 'Today' } as const)[demo.name] : 'Today';
  return (
    <Tab.Navigator initialRouteName={initial} screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' }, sceneStyle: { backgroundColor: colors.bg }, tabBarIcon: ({ color, size }) => <TabIcon name={ICON[route.name as keyof TabParamList]} color={color} size={size} /> })}>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Rules" component={RulesScreen} />
      <Tab.Screen name="Evals" component={EvalsScreen} />
      <Tab.Screen name="Me" component={MeScreen} />
    </Tab.Navigator>
  );
}
function Gate({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 28 }}><Text style={type.h1}>{title}</Text><Text style={[type.bodySoft, { marginTop: 10 }]}>{body}</Text>{action && onAction ? <PrimaryButton title={action} onPress={onAction} style={{ marginTop: 20 }} /> : null}</View>;
}
function Root() {
  const { ready, offline, error, profile, retry } = useApp();
  const [justOnboarded, setJustOnboarded] = useState(false);
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (offline) return <Gate title="Size Down is not configured" body="This build is missing its server settings. Email tryformaapp@gmail.com." />;
  if (error) return <Gate title="Could not reach the server" body={`${error}. Check your connection and try again.`} action="Try again" onAction={retry} />;
  if (!profile?.onboarded) return <OnboardingScreen onDone={() => setJustOnboarded(true)} />;
  const initial: keyof RootStackParamList = demo ? (demo.name === 'paywall' ? 'Paywall' : demo.name === 'trade' ? 'LogTrade' : demo.name === 'eval' ? 'Eval' : 'Tabs') : 'Tabs';
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName={initial} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="LogTrade" component={LogTradeScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Trade" component={TradeScreen} />
        <Stack.Screen name="NewEval" component={NewEvalScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Eval" component={EvalScreen} initialParams={demo ? { id: 'ev1' } : undefined} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const webFrame = Platform.OS === 'web' ? ({ width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: colors.bg } as const) : null;
const demoInsets = demo ? { paddingTop: 59, paddingBottom: 34 } : null;
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider><View style={[{ flex: 1 }, webFrame as any, demoInsets]}><Root /></View></AppProvider>
    </SafeAreaProvider>
  );
}
