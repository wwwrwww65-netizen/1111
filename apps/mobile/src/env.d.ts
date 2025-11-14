/// <reference types="expo/types" />

// Environment variable type declarations for EXPO_PUBLIC_* variables
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_TRPC_URL?: string;
    EXPO_PUBLIC_API_BASE?: string;
  }
}
