---
name: mobile-animations
description: Add animations to a React Native/Expo or Flutter app. Covers Reanimated 3 (shared values, worklets, gesture-driven), Lottie and Rive for vector animations, implicit and explicit Flutter animations, Hero transitions, and performance best practices. Use when the user wants smooth UI transitions, loading animations, or gesture-driven motion.
---

# Mobile Animations

## Trigger

Use this skill when the user:

- Wants to add animations to components, screens, or transitions
- Asks about Reanimated, Lottie, Rive, or Animated API
- Needs gesture-driven animations (swipe to dismiss, drag to reorder)
- Mentions "animation", "transition", "motion", "parallax", "spring", "fade", or "slide"
- Wants loading spinners, skeleton screens, or progress animations

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Animation type**: layout transition, gesture-driven, decorative (Lottie/Rive), or screen transition
- **Performance requirements**: 60fps target, heavy list animations, or simple fade/slide

## Workflow

1. **Choose an animation approach.** Each fits different use cases:

   | Approach | Framework | Best for | Performance |
   |---|---|---|---|
   | Reanimated 3 | React Native | Gesture-driven, layout, springs | UI thread (60fps) |
   | Lottie | Both | Designer-created vector animations | Good |
   | Rive | Both | Interactive state-machine animations | Good |
   | Animated API | React Native | Simple fade/slide | JS thread |
   | Implicit animations | Flutter | Simple property changes | Good |
   | AnimationController | Flutter | Complex sequenced animations | Good |

   Use Reanimated for anything interactive or performance-critical in RN. Use the built-in Animated API only for simple opacity/translate animations.

2. **Set up Reanimated (React Native).** Install:

   ```bash
   npx expo install react-native-reanimated
   ```

   Add the Babel plugin in `babel.config.js`:

   ```js
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: ["babel-preset-expo"],
       plugins: ["react-native-reanimated/plugin"],
     };
   };
   ```

3. **Create a Reanimated animation.** Fade-in on mount:

   ```tsx
   import Animated, {
     useSharedValue,
     useAnimatedStyle,
     withTiming,
   } from "react-native-reanimated";
   import { useEffect } from "react";

   export function FadeIn({ children }: { children: React.ReactNode }) {
     const opacity = useSharedValue(0);

     useEffect(() => {
       opacity.value = withTiming(1, { duration: 500 });
     }, []);

     const style = useAnimatedStyle(() => ({
       opacity: opacity.value,
     }));

     return <Animated.View style={style}>{children}</Animated.View>;
   }
   ```

4. **Add gesture-driven animation.** Swipe to dismiss with Reanimated + Gesture Handler:

   ```bash
   npx expo install react-native-gesture-handler
   ```

   ```tsx
   import Animated, {
     useSharedValue,
     useAnimatedStyle,
     withSpring,
     runOnJS,
   } from "react-native-reanimated";
   import { Gesture, GestureDetector } from "react-native-gesture-handler";

   export function SwipeToDismiss({
     children,
     onDismiss,
   }: {
     children: React.ReactNode;
     onDismiss: () => void;
   }) {
     const translateX = useSharedValue(0);

     const gesture = Gesture.Pan()
       .onUpdate((e) => {
         translateX.value = e.translationX;
       })
       .onEnd((e) => {
         if (Math.abs(e.translationX) > 150) {
           runOnJS(onDismiss)();
         } else {
           translateX.value = withSpring(0);
         }
       });

     const style = useAnimatedStyle(() => ({
       transform: [{ translateX: translateX.value }],
     }));

     return (
       <GestureDetector gesture={gesture}>
         <Animated.View style={style}>{children}</Animated.View>
       </GestureDetector>
     );
   }
   ```

5. **Add Lottie animations.** Install and use a JSON animation file:

   ```bash
   npx expo install lottie-react-native
   ```

   ```tsx
   import LottieView from "lottie-react-native";

   export function LoadingAnimation() {
     return (
       <LottieView
         source={require("../assets/loading.json")}
         autoPlay
         loop
         style={{ width: 200, height: 200 }}
       />
     );
   }
   ```

   Download free animations from [LottieFiles](https://lottiefiles.com).

6. **Flutter implicit animations.** Animate property changes automatically:

   ```dart
   AnimatedContainer(
     duration: const Duration(milliseconds: 300),
     curve: Curves.easeInOut,
     width: isExpanded ? 200 : 100,
     height: isExpanded ? 200 : 100,
     color: isActive ? Colors.blue : Colors.grey,
     child: child,
   )
   ```

7. **Flutter explicit animations.** Full control with AnimationController:

   ```dart
   class FadeInWidget extends StatefulWidget {
     final Widget child;
     const FadeInWidget({super.key, required this.child});

     @override
     State<FadeInWidget> createState() => _FadeInWidgetState();
   }

   class _FadeInWidgetState extends State<FadeInWidget>
       with SingleTickerProviderStateMixin {
     late final AnimationController _controller;
     late final Animation<double> _opacity;

     @override
     void initState() {
       super.initState();
       _controller = AnimationController(
         duration: const Duration(milliseconds: 500),
         vsync: this,
       );
       _opacity = Tween<double>(begin: 0, end: 1).animate(
         CurvedAnimation(parent: _controller, curve: Curves.easeIn),
       );
       _controller.forward();
     }

     @override
     void dispose() {
       _controller.dispose();
       super.dispose();
     }

     @override
     Widget build(BuildContext context) {
       return FadeTransition(opacity: _opacity, child: widget.child);
     }
   }
   ```

8. **Hero transitions (Flutter).** Shared element transitions between screens:

   ```dart
   // Source screen
   Hero(tag: 'product-${product.id}', child: Image.network(product.imageUrl))

   // Destination screen
   Hero(tag: 'product-${product.id}', child: Image.network(product.imageUrl))
   ```

## Key References

- [Reanimated: Getting Started](https://docs.swmansion.com/react-native-reanimated/docs/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [Lottie for React Native](https://github.com/lottie-react-native/lottie-react-native)
- [Rive for React Native](https://rive.app/community/doc/react-native/docvlgbnS1mp)
- [Flutter: Animations](https://docs.flutter.dev/ui/animations)

## Example Interaction

**User:** "I want a card that fades in when it appears and can be swiped away."

**Agent:**
1. Installs react-native-reanimated and react-native-gesture-handler with `mobile_installDependency`
2. Adds the Reanimated Babel plugin
3. Creates a `FadeIn` wrapper component using `useSharedValue` and `withTiming`
4. Creates a `SwipeToDismiss` wrapper using `Gesture.Pan()` with spring-back
5. Composes them: `<SwipeToDismiss onDismiss={remove}><FadeIn><Card /></FadeIn></SwipeToDismiss>`
6. Runs `mobile_checkBuildHealth` to verify the native module setup

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install animation libs | `mobile_installDependency` | Install react-native-reanimated, lottie-react-native |
| Generate component | `mobile_generateComponent` | Scaffold an animated component with props and styles |
| Verify build | `mobile_checkBuildHealth` | Ensure native modules compile after adding Reanimated |

## Common Pitfalls

1. **Missing Babel plugin** - Reanimated requires `react-native-reanimated/plugin` as the last plugin in `babel.config.js`. Without it, worklets crash at runtime.
2. **Animating on the JS thread** - The built-in `Animated` API runs on the JS thread and drops frames during heavy work. Use Reanimated for 60fps animations.
3. **Not using `useAnimatedStyle`** - Passing shared values directly to `style` does not work. Wrap them in `useAnimatedStyle` for Reanimated.
4. **Lottie file size** - Large Lottie JSON files (>100KB) slow initial render. Use the `dotLottie` format or lazy-load animations.
5. **Flutter dispose** - Forgetting to call `_controller.dispose()` in `dispose()` causes memory leaks. Always clean up AnimationControllers.
6. **Reanimated requires a dev build** - Reanimated does not work in Expo Go. Use a dev client or EAS Build.

## See Also

- [Mobile Component Patterns](../mobile-component-patterns/SKILL.md) - composable component architecture for animated wrappers
- [Mobile Performance](../../rules/mobile-performance.mdc) - avoid inline styles and heavy re-renders that kill animation fps
- [Mobile Navigation Setup](../mobile-navigation-setup/SKILL.md) - screen transition animations in Expo Router
