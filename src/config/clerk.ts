import { Theme } from "@clerk/types";

export const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || '';

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing CLERK_PUBLISHABLE_KEY');
}

export const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
  appearance: {
    baseTheme: 'light' as unknown as Theme['baseTheme'],
    variables: {
      colorPrimary: '#0ea5e9',
    },
  },
};
