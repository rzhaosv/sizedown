import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
export type TabParamList = { Today: undefined; Journal: undefined; Rules: undefined; Evals: undefined; Me: undefined };
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  LogTrade: { evalId?: string | null } | undefined;
  Trade: { id: string };
  NewEval: undefined;
  Eval: { id: string };
  Paywall: { reason?: string } | undefined;
};
export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<BottomTabScreenProps<TabParamList, T>, NativeStackScreenProps<RootStackParamList>>;
