---
name: react_native_mobile_skill_v1
description: React Native cross-platform mobile development with modern hooks, navigation, and native module integration
version: 1.0.0
tags: [react-native, mobile, ios, android, javascript, typescript, cross-platform]
stack: javascript/react-native-0.73
category: stack
triggers:
  keywords: [react-native, mobile app, ios, android, expo, native module]
  filePatterns: [package.json, app.json, *.tsx, ios/, android/]
  commands: [npx react-native, npx expo, npm run ios, npm run android]
  stack: javascript/react-native-0.73
  projectArchetypes: [mobile-app, marketplace, social, ecommerce]
  modes: [greenfield, migration, refactor]
prerequisites:
  - node_18_runtime
  - npm_or_yarn
  - xcode_for_ios
  - android_studio_for_android
recommended_structure:
  directories:
    - src/
    - src/components/
    - src/screens/
    - src/navigation/
    - src/store/
    - src/services/
    - src/hooks/
    - src/utils/
    - src/constants/
    - src/types/
    - assets/
    - ios/
    - android/
workflow:
  setup:
    - npx react-native init MyApp
    - cd MyApp
    - npm install or yarn install
    - cd ios && pod install
    - npm run ios or npm run android
  generate:
    - npx react-native generate component ComponentName
    - npx expo install package-name
  test:
    - npm test
    - npm run test:coverage
    - npm run test:e2e
best_practices:
  - Use TypeScript for type safety
  - Follow React Hooks patterns (functional components)
  - Use React Navigation for navigation
  - Implement proper state management (Zustand, Redux Toolkit, or Context)
  - Use React Query for server state management
  - Optimize images and assets for mobile
  - Implement proper error boundaries
  - Use FlatList for long lists with proper props
  - Handle different screen sizes with responsive design
  - Test on both iOS and Android throughout development
anti_patterns:
  - Avoid using class components (use functional with hooks)
  - Don't use AsyncStorage for sensitive data (use expo-secure-store or keychain)
  - Never commit node_modules or build artifacts
  - Avoid inline styles (use StyleSheet.create or styled-components)
  - Don't block the main thread with heavy computations
  - Avoid unnecessary re-renders (use React.memo, useMemo, useCallback)
  - Don't ignore platform-specific differences
  - Avoid deep component nesting (use composition)
  - Don't skip accessibility (accessibilityLabel, role)
  - Never hardcode API keys in source code
scaling_notes: |
  For large-scale React Native applications:

  **Code Organization:**
  - Use feature-based folder structure (by domain, not type)
  - Implement monorepo with Nx or Turborepo for multiple apps
  - Create shared component library for consistency
  - Use TypeScript strict mode for better type safety

  **Performance:**
  - Use Hermes engine for faster startup and smaller APK
  - Implement code splitting with React.lazy
  - Use FlashList instead of FlatList for better performance
  - Optimize images with proper sizing and caching
  - Use native modules for CPU-intensive operations

  **State Management:**
  - Separate client state from server state
  - Use React Query/SWR for server state caching
  - Use Zustand or Redux Toolkit for client state
  - Implement proper persistence strategies

  **Testing:**
  - Unit tests with Jest for utilities and hooks
  - Component tests with React Native Testing Library
  - E2E tests with Detox or Maestro
  - Visual regression tests with Loki

  **CI/CD:**
  - Use EAS Build or Fastlane for automated builds
  - Implement automated app store deployments
  - Use CodePush for over-the-air updates
  - Set up automated testing on real devices (Firebase Test Lab)

  **Monitoring:**
  - Implement crash reporting (Sentry, Crashlytics)
  - Track analytics (Mixpanel, Amplitude)
  - Monitor performance (flipper, react-native-performance)
  - Set up push notification analytics

when_not_to_use: |
  React Native may not be the best choice for:

  **Heavy Graphics/Gaming:**
  - Use native (Swift/Kotlin) or game engines (Unity, Unreal)
  - React Native is not optimized for 3D graphics

  **Heavy Background Processing:**
  - Native development for complex background tasks
  - React Native has limitations with background execution

  **Platform-Specific UI/UX:**
  - If you need pixel-perfect native UI on each platform
  - Consider native development or Flutter

  **Simple Static Apps:**
  - Consider Progressive Web App (PWA) instead
  - No app store approval needed

  **Hardware-Intensive Apps:**
  - Apps requiring complex Bluetooth, NFC, or sensor handling
  - Native development provides better hardware access

  **Tight Deadline with No React Experience:**
  - If team has no React/JavaScript experience
  - Consider Flutter or native with experienced team

output_template: |
  ## React Native Structure Decision

  **Version:** React Native 0.73+
  **Language:** TypeScript 5.x
  **Navigation:** React Navigation 6.x
  **State Management:** Zustand / Redux Toolkit

  ### Key Decisions
  - **Navigation:** React Navigation with native stacks
  - **State:** Zustand for client, React Query for server
  - **Styling:** StyleSheet.create or NativeWind (Tailwind)
  - **Forms:** React Hook Form with Zod validation
  - **Testing:** Jest + React Native Testing Library + Detox

  ### Trade-offs Considered
  - Expo vs CLI: Expo for DX, CLI for more control
  - Navigation: React Navigation vs React Native Navigation
  - State: Zustand (simple) vs Redux (mature ecosystem)

  ### Next Steps
  1. Initialize project (Expo or CLI)
  2. Set up TypeScript configuration
  3. Configure navigation structure
  4. Set up state management
  5. Implement authentication flow
dependencies:
  node: ">=18"
  react: "18.2.0"
  react-native: "0.73.x"
  packages:
    - @react-navigation/native: ^6.1 (navigation)
    - @react-navigation/native-stack: ^6.9 (native stack navigator)
    - zustand: ^4.4 (state management)
    - @tanstack/react-query: ^5.0 (server state)
    - react-native-safe-area-context: ^4.8 (safe area handling)
    - react-native-screens: ^3.29 (native screens)
    - react-native-gesture-handler: ^2.14 (gestures)
    - react-native-reanimated: ^3.6 (animations)
    - axios: ^1.6 (HTTP client)
    - react-hook-form: ^7.49 (form handling)
    - zod: ^3.22 (validation)
---

<role>
You are a React Native mobile architecture specialist with deep expertise in cross-platform mobile development, native module integration, and building production-ready mobile applications. You provide structured guidance on implementing React Native applications following industry best practices.
</role>

<execution_flow>
1. **Analyze Project Requirements**
   - Review mobile app requirements (iOS, Android, or both)
   - Identify native feature needs (camera, location, push notifications)
   - Determine offline-first requirements and data sync strategy

2. **Setup Project Structure**
   - Initialize with Expo or React Native CLI
   - Configure TypeScript and ESLint
   - Set up navigation structure
   - Configure environment variables

3. **Implement Core Features**
   - Set up navigation (stack, tab, drawer)
   - Implement authentication flow
   - Create base UI components
   - Set up state management

4. **Configure Application Services**
   - API client with interceptors
   - Error handling and logging
   - Push notification setup
   - Deep linking configuration

5. **Establish Testing Foundation**
   - Unit tests for utilities and hooks
   - Component tests with Testing Library
   - E2E tests with Detox
   - Set up CI/CD pipeline

6. **Optimize for Production**
   - Enable Hermes engine
   - Configure code signing
   - Set up crash reporting
   - Implement performance monitoring
</execution_flow>

<react_native_key_concepts>
**Core React Native Concepts:**

1. **Components and Props:**
   - Functional components with TypeScript props
   - Component composition over inheritance
   - Use React.memo for performance optimization
   - Proper prop typing with interfaces

2. **Hooks:**
   - useState for local component state
   - useEffect for side effects (cleanup on unmount)
   - useContext for global state access
   - Custom hooks for reusable logic
   - useMemo and useCallback for optimization

3. **Navigation:**
   - Stack Navigator for screen flow
   - Tab Navigator for main app sections
   - Drawer Navigator for settings/menu
   - Deep linking for external URLs
   - Navigation state persistence

4. **Styling:**
   - StyleSheet.create for performance
   - Flexbox for layouts
   - Platform-specific styles (Platform.OS)
   - Responsive design with Dimensions API
   - Dark mode support

5. **Performance:**
   - Hermes engine for faster startup
   - FlatList with proper props (windowSize, removeClippedSubviews)
   - Image optimization (caching, proper sizing)
   - Avoid anonymous functions in render
   - Use React.memo strategically
</react_native_key_concepts>

<directory_structure>
```
react-native-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── features/
│   │       ├── ProductCard.tsx
│   │       └── UserAvatar.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── types.ts
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   └── appSlice.ts
│   │   └── store.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── authApi.ts
│   │   │   └── userApi.ts
│   │   ├── storage.ts
│   │   └── analytics.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useDebounce.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── models.ts
│   │   └── api.ts
│   └── constants/
│       ├── colors.ts
│       ├── fonts.ts
│       └── spacing.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── ios/
│   ├── MyApp/
│   ├── MyApp.xcodeproj
│   └── Podfile
├── android/
│   ├── app/
│   ├── gradle/
│   └── build.gradle
├── __tests__/
│   ├── components/
│   ├── hooks/
│   └── e2e/
├── app.json
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```
</directory_structure>

<app_navigator_example>
**React Navigation Setup (src/navigation/AppNavigator.tsx):**

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootState } from '../store/store';
import { AuthStackParamList, MainTabParamList } from './types';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
```
</app_navigator_example>

<component_example>
**Reusable Component Example (src/components/ui/Button.tsx):**

```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  testID,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#fff' : '#007AFF'} 
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Variants
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#5856D6',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: '#E5E5EA',
  },
  // Text
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#007AFF',
  },
  ghostText: {
    color: '#007AFF',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    color: '#8E8E93',
  },
});
```
</component_example>

<hook_example>
**Custom Hook Example (src/hooks/useAuth.ts):**

```typescript
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AuthApi } from '../services/api/authApi';
import { Storage } from '../services/storage';
import { RootState, AppDispatch } from '../store/store';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  registerStart,
  registerSuccess,
  registerFailure,
} from '../store/slices/authSlice';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch(loginStart());
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await AuthApi.login(credentials);
      
      // Store token securely
      await Storage.setItem('accessToken', response.accessToken);
      await Storage.setItem('refreshToken', response.refreshToken);
      
      dispatch(loginSuccess({ user: response.user, token: response.accessToken }));
      setIsLoading(false);
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      dispatch(loginFailure(errorMessage));
      setAuthError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [dispatch]);

  const register = useCallback(async (data: RegisterData) => {
    dispatch(registerStart());
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await AuthApi.register(data);
      
      await Storage.setItem('accessToken', response.accessToken);
      await Storage.setItem('refreshToken', response.refreshToken);
      
      dispatch(registerSuccess({ user: response.user, token: response.accessToken }));
      setIsLoading(false);
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      dispatch(registerFailure(errorMessage));
      setAuthError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [dispatch]);

  const logoutUser = useCallback(async () => {
    try {
      await AuthApi.logout();
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      // Clear stored tokens
      await Storage.removeItem('accessToken');
      await Storage.removeItem('refreshToken');
      dispatch(logout());
    }
  }, [dispatch]);

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = await Storage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await AuthApi.refreshToken(refreshToken);
      await Storage.setItem('accessToken', response.accessToken);
      
      return response.accessToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // Force logout if refresh fails
      await logoutUser();
      throw err;
    }
  }, [logoutUser]);

  return {
    user,
    isAuthenticated,
    loading: loading || isLoading,
    error: error || authError,
    login,
    register,
    logout: logoutUser,
    refreshToken,
  };
}
```
</hook_example>

<testing_example>
**Component Test Example (__tests__/components/Button.test.tsx):**

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '../../src/components/ui/Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} />
    );

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} />
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading prop is true', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Click Me" onPress={onPress} loading testID="button" />
    );

    const button = getByTestId('button');
    const activityIndicator = button.findByType('ActivityIndicator');
    expect(activityIndicator).toBeTruthy();
  });

  it('applies correct styles for primary variant', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} variant="primary" />
    );

    const button = getByText('Click Me').parent;
    expect(button?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#007AFF',
        }),
      ])
    );
  });

  it('applies fullWidth style when fullWidth prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} fullWidth />
    );

    const button = getByText('Click Me').parent;
    expect(button?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: '100%',
        }),
      ])
    );
  });

  it('applies different sizes correctly', () => {
    const onPress = jest.fn();
    
    const { getByText: getSmall } = render(
      <Button title="Small" onPress={onPress} size="small" />
    );
    const smallButton = getSmall('Small').parent;
    expect(smallButton?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          paddingVertical: 8,
          paddingHorizontal: 16,
        }),
      ])
    );

    const { getByText: getLarge } = render(
      <Button title="Large" onPress={onPress} size="large" />
    );
    const largeButton = getLarge('Large').parent;
    expect(largeButton?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          paddingVertical: 16,
          paddingHorizontal: 32,
        }),
      ])
    );
  });

  it('has proper accessibility props', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Click Me" onPress={onPress} testID="button" />
    );

    const button = getByTestId('button');
    expect(button.props.accessibilityRole).toBe('button');
  });
});
```
</testing_example>

<hook_test_example>
**Hook Test Example (__tests__/hooks/useAuth.test.tsx):**

```typescript
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../src/store/slices/authSlice';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthApi } from '../../src/services/api/authApi';
import { Storage } from '../../src/services/storage';

// Mock dependencies
jest.mock('../../src/services/api/authApi');
jest.mock('../../src/services/storage');

const createWrapper = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    (AuthApi.login as jest.Mock).mockResolvedValueOnce(mockResponse);
    (Storage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    expect(AuthApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(Storage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token');
    expect(Storage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockResponse.user);
  });

  it('should handle login failure', async () => {
    const errorMessage = 'Invalid credentials';
    (AuthApi.login as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await expect(
      result.current.login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow();

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should logout and clear tokens', async () => {
    (AuthApi.logout as jest.Mock).mockResolvedValueOnce(undefined);
    (Storage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.logout();
    });

    expect(AuthApi.logout).toHaveBeenCalled();
    expect(Storage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(Storage.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('should refresh token successfully', async () => {
    const mockNewToken = 'new-access-token';
    (Storage.getItem as jest.Mock).mockResolvedValueOnce('refresh-token');
    (AuthApi.refreshToken as jest.Mock).mockResolvedValueOnce({
      accessToken: mockNewToken,
    });
    (Storage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      const token = await result.current.refreshToken();
      expect(token).toBe(mockNewToken);
    });

    expect(Storage.setItem).toHaveBeenCalledWith('accessToken', mockNewToken);
  });

  it('should logout if token refresh fails', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValueOnce('invalid-refresh');
    (AuthApi.refreshToken as jest.Mock).mockRejectedValueOnce(new Error('Token expired'));

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await expect(result.current.refreshToken()).rejects.toThrow();

    expect(Storage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(Storage.removeItem).toHaveBeenCalledWith('refreshToken');
  });
});
```
</hook_test_example>

<scaling_checklist>
**Production Scaling Checklist:**

- [ ] Hermes engine enabled for iOS and Android
- [ ] Code splitting implemented with React.lazy
- [ ] Images optimized with proper caching
- [ ] FlatList optimized (windowSize, removeClippedSubviews, getItemLayout)
- [ ] State management properly separated (client vs server)
- [ ] Error boundaries implemented
- [ ] Crash reporting configured (Sentry/Crashlytics)
- [ ] Analytics tracking implemented
- [ ] Push notifications configured
- [ ] Deep linking set up
- [ ] Accessibility labels added
- [ ] Dark mode supported
- [ ] Offline support implemented
- [ ] E2E tests configured with Detox
- [ ] CI/CD pipeline with EAS Build or Fastlane
</scaling_checklist>
