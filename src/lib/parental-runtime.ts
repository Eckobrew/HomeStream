import { AsyncLocalStorage } from 'async_hooks';
import { UserProfile } from '@/types';
const context = new AsyncLocalStorage<{ profile: UserProfile | null; device: string }>();
export const requestParentalProfile = () => context.getStore()?.profile;
export const requestParentalDevice = () => context.getStore()?.device || '';
export const withParentalProfile = <T>(profile: UserProfile | null, action: () => Promise<T>, device = '') => context.run({ profile, device }, action);
