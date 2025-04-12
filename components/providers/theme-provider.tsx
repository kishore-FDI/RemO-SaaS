import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Ensure `attribute` is properly typed
  const { attribute, defaultTheme, enableSystem, disableTransitionOnChange } = props;
  
  return (
    <NextThemesProvider
      attribute={attribute} 
      defaultTheme={defaultTheme} 
      enableSystem={enableSystem} 
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </NextThemesProvider>
  );
}
