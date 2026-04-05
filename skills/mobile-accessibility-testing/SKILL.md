---
name: mobile-accessibility-testing
description: Automated and manual accessibility auditing, WCAG compliance, and screen reader testing for mobile apps
---

# Mobile Accessibility Testing

## Trigger

Use this skill when the developer asks about:
- Accessibility (a11y) testing or auditing
- WCAG 2.1 AA compliance for mobile
- Screen reader testing with VoiceOver or TalkBack
- Missing accessibility labels, roles, or hints
- Touch target sizing requirements
- Dynamic type / font scaling support
- Reduced motion preferences
- Color contrast ratio validation
- CI integration for accessibility checks

## Required Inputs

| Input | Description |
| --- | --- |
| Framework | `expo` (React Native) or `flutter` |
| Scope | Full audit, specific screen, or CI setup |

## Workflow

### 1. Run Automated Audit

Use `mobile_auditAccessibility` for a static analysis scan:

```
Use MCP tool: mobile_auditAccessibility
  framework: "expo"
```

The tool scans source files for:
- Missing `accessibilityLabel` / `Semantics` on interactive elements
- Small touch targets (below 44px)
- Images without alt text
- Color-only state indicators
- Missing `accessibilityRole` annotations

### 2. React Native / Expo Checklist

#### Labels and Roles

```tsx
// Bad
<TouchableOpacity onPress={onDelete}>
  <Icon name="trash" />
</TouchableOpacity>

// Good
<TouchableOpacity
  onPress={onDelete}
  accessibilityLabel="Delete item"
  accessibilityRole="button"
  accessibilityHint="Removes this item from your list"
>
  <Icon name="trash" />
</TouchableOpacity>
```

#### Touch Targets

```tsx
// Minimum 44x44pt
<Pressable
  onPress={onPress}
  style={{ minWidth: 44, minHeight: 44 }}
  hitSlop={8}
>
  <Icon name="settings" size={24} />
</Pressable>
```

#### Dynamic Type Support

```tsx
import { PixelRatio } from "react-native";

const fontScale = PixelRatio.getFontScale();
// Ensure layouts don't break at 2x font scale

// Use maxFontSizeMultiplier on Text to cap if layout breaks
<Text maxFontSizeMultiplier={1.5}>Content</Text>
```

#### Reduced Motion

```tsx
import { AccessibilityInfo } from "react-native";

const [reduceMotion, setReduceMotion] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  const sub = AccessibilityInfo.addEventListener(
    "reduceMotionChanged",
    setReduceMotion
  );
  return () => sub.remove();
}, []);
```

#### Screen Reader Announcements

```tsx
import { AccessibilityInfo } from "react-native";

AccessibilityInfo.announceForAccessibility("Item deleted");
```

### 3. Flutter Checklist

#### Semantics

```dart
// Bad
GestureDetector(
  onTap: onDelete,
  child: Icon(Icons.delete),
)

// Good
Semantics(
  label: 'Delete item',
  button: true,
  hint: 'Removes this item from your list',
  child: GestureDetector(
    onTap: onDelete,
    child: const Icon(Icons.delete),
  ),
)
```

#### Touch Target Sizes

```dart
// Material guidelines: 48x48 logical pixels minimum
SizedBox(
  width: 48,
  height: 48,
  child: IconButton(
    onPressed: onSettings,
    icon: const Icon(Icons.settings),
  ),
)
```

#### Large Font Testing

```dart
MediaQuery(
  data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(2.0)),
  child: child,
)
```

#### Reduced Motion

```dart
final disableAnimations = MediaQuery.of(context).disableAnimations;
```

#### Semantic Announcements

```dart
SemanticsService.announce('Item deleted', TextDirection.ltr);
```

### 4. Manual Testing Protocol

#### VoiceOver (iOS)

1. Settings → Accessibility → VoiceOver → On
2. Swipe right to move to the next element
3. Double-tap to activate the focused element
4. Verify every interactive element is reachable and announced
5. Verify images have descriptions or are hidden from VoiceOver

#### TalkBack (Android)

1. Settings → Accessibility → TalkBack → On
2. Swipe right to navigate forward
3. Double-tap to activate
4. Verify focus order follows visual layout
5. Test all form inputs and custom controls

#### Test Matrix

| Test | Pass Criteria |
| --- | --- |
| All buttons announced | Label read aloud, role stated |
| Images described | Alt text read or skipped if decorative |
| Touch targets | ≥ 44pt (iOS) / ≥ 48dp (Android) |
| Contrast ratio | ≥ 4.5:1 normal text, ≥ 3:1 large text |
| Font scaling | Layout intact at 200% font size |
| Focus order | Logical top-to-bottom, left-to-right |
| Reduced motion | Animations skipped when enabled |

### 5. CI Integration

#### React Native (Jest + Testing Library)

```tsx
import { render } from "@testing-library/react-native";

test("delete button has accessibility label", () => {
  const { getByRole } = render(<DeleteButton />);
  const btn = getByRole("button", { name: "Delete item" });
  expect(btn).toBeTruthy();
});
```

#### Flutter (Widget Tests)

```dart
testWidgets('delete button has semantics', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: DeleteButton()));
  expect(
    find.bySemanticsLabel('Delete item'),
    findsOneWidget,
  );
});
```

## Key References

| Resource | URL |
| --- | --- |
| WCAG 2.1 (W3C) | https://www.w3.org/TR/WCAG21/ |
| RN Accessibility | https://reactnative.dev/docs/accessibility |
| Flutter Accessibility | https://docs.flutter.dev/accessibility-and-internationalization/accessibility |
| axe DevTools Mobile | https://www.deque.com/axe/devtools/mobile/ |
| iOS HIG Accessibility | https://developer.apple.com/design/human-interface-guidelines/accessibility |

## Example Interaction

**User:** "Run an accessibility audit on my app and fix any violations"

**Assistant:**
1. Runs `mobile_auditAccessibility` to scan all source files
2. Reports findings grouped by severity (critical → minor) with WCAG references
3. Fixes critical issues: adds `accessibilityLabel` and `accessibilityRole` to interactive elements
4. Fixes serious issues: increases touch targets to 44px minimum, adds alt text to images
5. Suggests manual testing protocol with VoiceOver/TalkBack
6. Generates a11y test file with `mobile_generateTestFile` to prevent regressions

## MCP Usage

| Tool | When |
| --- | --- |
| `mobile_auditAccessibility` | Run automated a11y scan on the project |
| `mobile_generateTestFile` | Generate a11y-focused test file |

## Common Pitfalls

- **Decorative images not excluded**  - set `accessible={false}` (RN) or `excludeFromSemantics: true` (Flutter).
- **Custom components missing semantics**  - every interactive custom widget needs labels.
- **Focus traps**  - modals and bottom sheets must trap focus and release it on close.
- **Skipping platform testing**  - VoiceOver and TalkBack behavior differs; test on both.
- **Hardcoded font sizes without scaling**  - use relative sizes or test at max scale.
- **Color-only errors**  - form validation errors must include text or icons, not just red borders.

## See Also

- `mobile-theming`  - semantic color tokens for consistent contrast
- `mobile-component-patterns`  - accessible component architecture
- `mobile-forms-validation`  - accessible form error handling
