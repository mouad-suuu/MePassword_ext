import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { theme } from "../them";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const textStyles = {
  heading: theme.text.heading,
  subheading: theme.text.subheading,
  body: theme.text.body,
  small: theme.text.small,
};

export const gradients = {
  primary: `bg-gradient-to-r from-[${theme.colors.accent.primary}] to-[${theme.colors.accent.blue}]`,
  secondary: `bg-gradient-to-r from-[${theme.colors.accent.secondary}] to-[${theme.colors.accent.blue}]`,
};
