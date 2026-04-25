---
name: mobile-component-patterns
description: Build reusable, maintainable React Native components. Covers compound components, custom hooks, style patterns (StyleSheet vs NativeWind), screen vs component separation, and testing with React Native Testing Library. Use when the user needs component architecture guidance.
standards-version: 1.7.0
---

# Mobile Component Patterns

## Trigger

Use this skill when the user:

- Wants to build reusable UI components for React Native
- Asks about component architecture or project structure
- Needs help organizing screens vs shared components
- Asks about styling approaches (StyleSheet, NativeWind, styled-components)
- Wants to add component tests
- Mentions "component", "reusable", "pattern", "StyleSheet", "NativeWind", "testing", or "RNTL"

## Required Inputs

- **Component name**: What they are building (e.g., Button, Card, Avatar)
- **Reuse scope**: App-wide, screen-specific, or design system
- **Styling preference** (optional): StyleSheet, NativeWind, or no preference

## Workflow

1. **Distinguish screens from components.** Screens and components live in different directories and have different responsibilities:

   ```
   app/                  # Screens (route endpoints, full-page views)
   ├── (tabs)/
   │   └── index.tsx     # Screen: fetches data, composes components
   components/           # Reusable components (UI building blocks)
   ├── ui/               # Primitive UI components
   │   ├── Button.tsx
   │   ├── Card.tsx
   │   └── Avatar.tsx
   ├── forms/            # Form-specific components
   │   ├── TextInput.tsx
   │   └── Select.tsx
   └── layout/           # Layout wrappers
       ├── Container.tsx
       └── Section.tsx
   ```

   Rules:
   - Screens fetch data, compose components, and handle navigation
   - Components receive data via props, never fetch their own data
   - Components never call `useRouter()` directly (pass callbacks instead)

2. **Build a typed component with StyleSheet.** The standard React Native approach:

   ```tsx
   import { View, Text, Pressable, StyleSheet } from "react-native";

   interface ButtonProps {
     title: string;
     variant?: "primary" | "secondary" | "ghost";
     disabled?: boolean;
     onPress: () => void;
   }

   export function Button({
     title,
     variant = "primary",
     disabled = false,
     onPress,
   }: ButtonProps) {
     return (
       <Pressable
         style={({ pressed }) => [
           styles.base,
           styles[variant],
           pressed && styles.pressed,
           disabled && styles.disabled,
         ]}
         disabled={disabled}
         onPress={onPress}
       >
         <Text style={[styles.text, variant === "ghost" && styles.ghostText]}>
           {title}
         </Text>
       </Pressable>
     );
   }

   const styles = StyleSheet.create({
     base: {
       paddingHorizontal: 20,
       paddingVertical: 12,
       borderRadius: 8,
       alignItems: "center",
     },
     primary: { backgroundColor: "#007AFF" },
     secondary: { backgroundColor: "#E5E5EA" },
     ghost: { backgroundColor: "transparent" },
     pressed: { opacity: 0.7 },
     disabled: { opacity: 0.4 },
     text: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
     ghostText: { color: "#007AFF" },
   });
   ```

3. **Alternative: NativeWind (Tailwind for React Native).** Install:

   ```bash
   npx expo install nativewind tailwindcss
   ```

   Same button with NativeWind:

   ```tsx
   import { Text, Pressable } from "react-native";

   interface ButtonProps {
     title: string;
     variant?: "primary" | "secondary" | "ghost";
     disabled?: boolean;
     onPress: () => void;
   }

   const variantClasses = {
     primary: "bg-blue-500",
     secondary: "bg-gray-200",
     ghost: "bg-transparent",
   } as const;

   const textClasses = {
     primary: "text-white",
     secondary: "text-gray-900",
     ghost: "text-blue-500",
   } as const;

   export function Button({
     title,
     variant = "primary",
     disabled = false,
     onPress,
   }: ButtonProps) {
     return (
       <Pressable
         className={`px-5 py-3 rounded-lg items-center ${variantClasses[variant]} ${disabled ? "opacity-40" : ""}`}
         disabled={disabled}
         onPress={onPress}
       >
         <Text className={`text-base font-semibold ${textClasses[variant]}`}>
           {title}
         </Text>
       </Pressable>
     );
   }
   ```

4. **Compound component pattern.** For components with multiple related parts (e.g., a card with header, body, footer):

   ```tsx
   import { View, Text, StyleSheet } from "react-native";
   import type { ReactNode } from "react";

   interface CardProps {
     children: ReactNode;
   }

   function Card({ children }: CardProps) {
     return <View style={styles.card}>{children}</View>;
   }

   function CardHeader({ children }: { children: ReactNode }) {
     return <View style={styles.header}>{children}</View>;
   }

   function CardBody({ children }: { children: ReactNode }) {
     return <View style={styles.body}>{children}</View>;
   }

   function CardFooter({ children }: { children: ReactNode }) {
     return <View style={styles.footer}>{children}</View>;
   }

   Card.Header = CardHeader;
   Card.Body = CardBody;
   Card.Footer = CardFooter;

   export { Card };

   const styles = StyleSheet.create({
     card: {
       borderRadius: 12,
       backgroundColor: "#FFFFFF",
       shadowColor: "#000",
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.1,
       shadowRadius: 4,
       elevation: 3,
     },
     header: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E5EA" },
     body: { padding: 16 },
     footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E5EA" },
   });
   ```

   Usage:

   ```tsx
   <Card>
     <Card.Header><Text>Title</Text></Card.Header>
     <Card.Body><Text>Content here</Text></Card.Body>
     <Card.Footer><Button title="Action" onPress={handlePress} /></Card.Footer>
   </Card>
   ```

5. **Custom hooks for component logic.** Extract reusable logic into hooks:

   ```tsx
   import { useState, useCallback } from "react";

   export function useToggle(initial = false) {
     const [value, setValue] = useState(initial);
     const toggle = useCallback(() => setValue((v) => !v), []);
     const setOn = useCallback(() => setValue(true), []);
     const setOff = useCallback(() => setValue(false), []);
     return { value, toggle, setOn, setOff } as const;
   }
   ```

6. **Testing with React Native Testing Library.** Install:

   ```bash
   npm install --save-dev @testing-library/react-native @testing-library/jest-native
   ```

   Write a test for the Button component:

   ```tsx
   import { render, screen, fireEvent } from "@testing-library/react-native";
   import { Button } from "../Button";

   describe("Button", () => {
     it("renders the title", () => {
       render(<Button title="Submit" onPress={() => {}} />);
       expect(screen.getByText("Submit")).toBeTruthy();
     });

     it("calls onPress when tapped", () => {
       const onPress = jest.fn();
       render(<Button title="Submit" onPress={onPress} />);
       fireEvent.press(screen.getByText("Submit"));
       expect(onPress).toHaveBeenCalledTimes(1);
     });

     it("does not call onPress when disabled", () => {
       const onPress = jest.fn();
       render(<Button title="Submit" disabled onPress={onPress} />);
       fireEvent.press(screen.getByText("Submit"));
       expect(onPress).not.toHaveBeenCalled();
     });
   });
   ```

7. **Generate components quickly with MCP.** Use the `mobile_generateComponent` tool:

   ```
   mobile_generateComponent(name: "Avatar", directory: "components/ui", with_tests: true)
   ```

## Key References

- [React Native: Core Components](https://reactnative.dev/docs/components-and-apis)
- [NativeWind docs](https://www.nativewind.dev/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [StyleSheet API](https://reactnative.dev/docs/stylesheet)

## Example Interaction

**User:** "I need a reusable Card component with a header, body, and optional footer. Should work across the whole app."

**Agent:**
1. Creates `components/ui/Card.tsx` using the compound component pattern
2. Adds typed props for each sub-component
3. Uses StyleSheet with shadow/elevation for cross-platform shadows
4. Creates a test file at `components/ui/__tests__/Card.test.tsx`
5. Shows usage example in a screen

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Scaffold component | `mobile_generateComponent` | Create component file with typed props and StyleSheet |
| Scaffold with tests | `mobile_generateComponent` | Set `with_tests: true` to generate a test file alongside |
| Install NativeWind | `mobile_installDependency` | Run `npx expo install nativewind tailwindcss` |
| Install testing lib | `mobile_installDependency` | Install React Native Testing Library |

## Common Pitfalls

1. **Inline styles everywhere** - They create new objects on every render, defeating React's optimization. Use `StyleSheet.create()` for static styles.
2. **Components that fetch their own data** - Components should receive data via props. Data fetching belongs in screens or custom hooks, not in reusable components.
3. **Mixing navigation logic into components** - Pass `onPress` callbacks instead of calling `router.push()` inside a reusable component. This keeps it decoupled from the routing layer.
4. **Not handling platform differences** - Some style properties (e.g., `shadow*` vs `elevation`) behave differently on iOS and Android. Use `Platform.select()` when needed.
5. **Skipping TypeScript props** - Always define an `interface` for component props. It provides autocompletion, catches misuse, and serves as documentation.
6. **Forgetting `key` in lists** - When rendering components in `FlatList` or `map()`, always provide a stable, unique `key` or `keyExtractor`.

## See Also

- [Mobile Navigation Setup](../mobile-navigation-setup/SKILL.md) - screens that use these components
- [Mobile State Management](../mobile-state-management/SKILL.md) - hooks and stores that feed data into components
