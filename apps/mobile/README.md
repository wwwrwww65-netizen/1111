# E-commerce Mobile App

React Native mobile application built with Expo, providing a native shopping experience for iOS and Android.

## Features

- Product browsing and search
- Category navigation
- Shopping cart management
- Wishlist functionality
- Product quick view
- tRPC API integration
- Type-safe navigation
- Secure token storage

## Tech Stack

- **Framework**: Expo ~51.0.8
- **UI Library**: React Native 0.74.5
- **Navigation**: React Navigation 6.x
- **State Management**: TanStack Query (React Query) 4.x
- **API Client**: tRPC 10.x
- **Language**: TypeScript
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint with TypeScript support

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm 8.6.10
- Expo CLI (installed via dependencies)

### Installation

From the repository root:

```bash
pnpm install
```

### Development

Start the Expo development server:

```bash
pnpm --filter mobile start
```

Or from the mobile directory:

```bash
cd apps/mobile
pnpm start
```

Run on specific platforms:

```bash
pnpm --filter mobile android  # Android device/emulator
pnpm --filter mobile ios      # iOS simulator (macOS only)
pnpm --filter mobile web      # Web browser
```

## Available Scripts

### Development
- `pnpm start` - Start Expo development server
- `pnpm android` - Start on Android device/emulator
- `pnpm ios` - Start on iOS simulator (macOS only)
- `pnpm web` - Start in web browser

### Quality Assurance
- `pnpm lint` - Run ESLint to check code quality
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test` - Run Jest tests
- `pnpm test:coverage` - Run tests with coverage report

### Build
- `pnpm build` - Export production build for Android and iOS

## Project Structure

```
apps/mobile/
├── __tests__/              # Test files
│   └── App.test.tsx       # App component tests
├── assets/                 # Static assets (images, fonts)
├── src/
│   ├── components/        # Reusable React components
│   │   ├── BannerSection.tsx
│   │   ├── CarouselSection.tsx
│   │   ├── GridSection.tsx
│   │   └── QuickViewModal.tsx
│   ├── screens/           # Screen components
│   │   └── HomeScreen.tsx
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts       # Secure token handling
│   │   └── nav.ts        # Navigation utilities
│   ├── types/             # TypeScript type definitions
│   │   └── home.ts       # Home screen types
│   ├── env.d.ts          # Environment variable types
│   └── trpc.ts           # tRPC client setup
├── App.tsx                # Root application component
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── jest.config.js        # Jest test configuration
├── tsconfig.json         # TypeScript configuration
├── .eslintrc.js         # ESLint configuration
└── package.json          # Dependencies and scripts
```

## Configuration

### Environment Variables

Environment variables are configured via `app.json` under the `extra` field:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_TRPC_URL": "https://api.jeeey.com/trpc"
    }
  }
}
```

Access them in code:

```typescript
process.env.EXPO_PUBLIC_TRPC_URL
```

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
// Instead of: import { auth } from '../../lib/auth'
import { auth } from '@/lib/auth';
```

Configured in:
- `tsconfig.json` - TypeScript path mapping
- `babel.config.js` - Babel module resolution

### Type Safety

All components and utilities are fully typed with TypeScript. Key type definitions:

- `src/types/home.ts` - Home screen section types (Banner, Carousel, Grid)
- `src/lib/nav.ts` - Navigation link types
- `src/env.d.ts` - Environment variable types

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode (for development)
pnpm test --watch
```

### Writing Tests

Tests use Jest and React Native Testing Library:

```typescript
import { render, screen } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

## Linting

The project uses ESLint with TypeScript support:

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

Configuration is in `.eslintrc.js`.

## Building

### Development Build

```bash
pnpm build
```

This creates an export in the `dist/` directory.

### Production Build with EAS

For production builds with EAS Build:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

See `eas.json` for build configuration.

## CI/CD

The mobile app has a GitHub Actions workflow (`.github/workflows/mobile-build.yml`) that:

1. Runs on changes to `apps/mobile/**` or `packages/ui/**`
2. Checks out code and installs dependencies
3. Runs type checking (`pnpm type-check`)
4. Runs linting (`pnpm lint`)
5. Runs tests with coverage (`pnpm test`)
6. Builds the app (`pnpm build`)
7. Performs basic smoke test (API health check)
8. Uploads build artifacts and coverage reports

Workflow can be triggered manually via GitHub Actions UI.

## Adding New Screens

1. Create screen component in `src/screens/`
2. Add navigation type to `App.tsx` or navigation config
3. Register screen in navigator
4. Add tests in `__tests__/`

Example:

```typescript
// src/screens/NewScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';

export default function NewScreen() {
  return (
    <View>
      <Text>New Screen</Text>
    </View>
  );
}

// Add to navigator in App.tsx
<Stack.Screen name="NewScreen" component={NewScreen} />
```

## Adding New Home Section Types

To add a new section type to the home screen:

1. Add type definition in `src/types/home.ts`:

```typescript
export interface NewSectionData {
  type: 'new-section';
  id: string;
  // ... your fields
}

export type HomeSectionData = 
  | BannerSectionData 
  | CarouselSectionData 
  | GridSectionData
  | NewSectionData;  // Add here
```

2. Create component in `src/components/NewSection.tsx`
3. Update HomeScreen to render the new section type
4. Add tests for the new component

## Security

### Token Storage

The app uses a secure token storage abstraction in `src/lib/auth.ts`:

```typescript
import { auth } from '@/lib/auth';

// Store token
await auth.setAccessToken(token);

// Retrieve token
const token = await auth.getAccessToken();

// Check authentication
const isAuthed = await auth.isAuthenticated();

// Logout
await auth.logout();
```

**⚠️ IMPORTANT**: The current implementation uses in-memory storage as a placeholder. 
For production, install `expo-secure-store` and update `src/lib/auth.ts` to use SecureStore 
for sensitive tokens.

```bash
npx expo install expo-secure-store
```

## Known Issues & TODOs

### TODO (Priority)

- [ ] Implement token refresh logic in `src/lib/auth.ts`
- [ ] Replace in-memory token storage with expo-secure-store
- [ ] Add smoke tests for cart actions and tRPC queries
- [ ] Implement remote config integration for home sections
- [ ] Add error boundary for better error handling

### TODO (Future)

- [ ] Integrate end-to-end Detox tests
- [ ] Add deep linking support
- [ ] Implement push notifications
- [ ] Add analytics tracking
- [ ] Implement offline support with AsyncStorage caching
- [ ] Add image optimization and lazy loading
- [ ] Implement pull-to-refresh on list screens
- [ ] Add skeleton loaders for better UX

## Troubleshooting

### Metro bundler issues

Clear cache and restart:

```bash
pnpm start --clear
```

### Type errors

Ensure TypeScript is up to date and run type check:

```bash
pnpm type-check
```

### Test failures

Run tests in watch mode to debug:

```bash
pnpm test --watch
```

### ESLint errors

Auto-fix common issues:

```bash
pnpm lint:fix
```

## Contributing

1. Create a feature branch from `capolit`
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Create a pull request targeting `capolit`

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [tRPC Documentation](https://trpc.io/)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
