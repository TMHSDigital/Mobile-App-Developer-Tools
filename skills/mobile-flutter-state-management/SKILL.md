---
name: mobile-flutter-state-management
description: Choose and implement state management in a Flutter app. Covers Riverpod (recommended), Bloc, Provider, and setState. Patterns for async data, code generation, and testing. Use when the user needs to manage state beyond simple widget-local state.
---

# Flutter State Management

## Trigger

Use this skill when the user:

- Asks which state management to use in Flutter
- Needs to share state across multiple widgets
- Wants to manage async data (API calls, streams)
- Mentions "Riverpod", "Bloc", "Provider", "setState", "state management", or "Cubit"
- Asks about code generation with `riverpod_generator` or `freezed`

## Required Inputs

- **Complexity level**: simple (local state), moderate (shared state), complex (event-driven architecture)
- **Async data** (optional): whether the app fetches data from APIs or databases
- **Preferred library** (optional): Riverpod, Bloc, or Provider (defaults to Riverpod recommendation)

## Workflow

1. **Choose the right approach.** Decision matrix:

   | Scenario | Recommendation | Why |
   |----------|---------------|-----|
   | Counter, form inputs, toggle | `setState` | No library needed for widget-local state |
   | Shared state across screens | Riverpod | Simple API, compile-safe, testable |
   | Complex event-driven flows | Bloc | Explicit events/states, great for large teams |
   | Legacy codebase | Provider | Widely used, simpler than Bloc, but being superseded by Riverpod |
   | Server state / API caching | Riverpod `AsyncNotifier` | Built-in loading/error states |

2. **Riverpod (recommended).** Install:

   ```bash
   flutter pub add flutter_riverpod riverpod_annotation
   flutter pub add --dev riverpod_generator build_runner
   ```

   Wrap the app in `ProviderScope`:

   ```dart
   void main() {
     runApp(const ProviderScope(child: App()));
   }
   ```

   **Simple state provider:**

   ```dart
   import 'package:riverpod_annotation/riverpod_annotation.dart';

   part 'counter_provider.g.dart';

   @riverpod
   class Counter extends _$Counter {
     @override
     int build() => 0;

     void increment() => state++;
     void decrement() => state--;
   }
   ```

   Run code generation:

   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

   Use in a widget:

   ```dart
   class CounterScreen extends ConsumerWidget {
     const CounterScreen({super.key});

     @override
     Widget build(BuildContext context, WidgetRef ref) {
       final count = ref.watch(counterProvider);

       return Scaffold(
         body: Center(child: Text('Count: $count')),
         floatingActionButton: FloatingActionButton(
           onPressed: () => ref.read(counterProvider.notifier).increment(),
           child: const Icon(Icons.add),
         ),
       );
     }
   }
   ```

   **Async data (API calls):**

   ```dart
   @riverpod
   class TodoList extends _$TodoList {
     @override
     Future<List<Todo>> build() async {
       final response = await ref.read(apiClientProvider).getTodos();
       return response;
     }

     Future<void> addTodo(String title) async {
       state = const AsyncLoading();
       state = await AsyncValue.guard(() async {
         await ref.read(apiClientProvider).createTodo(title);
         return ref.read(apiClientProvider).getTodos();
       });
     }
   }
   ```

   Consume async state:

   ```dart
   @override
   Widget build(BuildContext context, WidgetRef ref) {
     final todosAsync = ref.watch(todoListProvider);

     return todosAsync.when(
       data: (todos) => ListView.builder(
         itemCount: todos.length,
         itemBuilder: (context, index) => TodoTile(todo: todos[index]),
       ),
       loading: () => const Center(child: CircularProgressIndicator()),
       error: (error, stack) => Center(child: Text('Error: $error')),
     );
   }
   ```

   **Key Riverpod concepts:**

   | API | Use for |
   |-----|---------|
   | `ref.watch(provider)` | Rebuild widget when state changes |
   | `ref.read(provider)` | Read once without listening (use in callbacks) |
   | `ref.listen(provider, callback)` | Side effects (show snackbar, navigate) |
   | `ref.invalidate(provider)` | Force a provider to recompute |
   | `provider.notifier` | Access methods on a Notifier class |

3. **Bloc pattern.** Install:

   ```bash
   flutter pub add flutter_bloc
   ```

   Define events and states:

   ```dart
   // Events
   sealed class AuthEvent {}
   class AuthLoginRequested extends AuthEvent {
     final String email;
     final String password;
     AuthLoginRequested({required this.email, required this.password});
   }
   class AuthLogoutRequested extends AuthEvent {}

   // States
   sealed class AuthState {}
   class AuthInitial extends AuthState {}
   class AuthLoading extends AuthState {}
   class AuthAuthenticated extends AuthState {
     final User user;
     AuthAuthenticated(this.user);
   }
   class AuthError extends AuthState {
     final String message;
     AuthError(this.message);
   }
   ```

   Implement the Bloc:

   ```dart
   class AuthBloc extends Bloc<AuthEvent, AuthState> {
     final AuthRepository _authRepo;

     AuthBloc(this._authRepo) : super(AuthInitial()) {
       on<AuthLoginRequested>(_onLogin);
       on<AuthLogoutRequested>(_onLogout);
     }

     Future<void> _onLogin(
       AuthLoginRequested event,
       Emitter<AuthState> emit,
     ) async {
       emit(AuthLoading());
       try {
         final user = await _authRepo.login(event.email, event.password);
         emit(AuthAuthenticated(user));
       } catch (e) {
         emit(AuthError(e.toString()));
       }
     }

     Future<void> _onLogout(
       AuthLogoutRequested event,
       Emitter<AuthState> emit,
     ) async {
       await _authRepo.logout();
       emit(AuthInitial());
     }
   }
   ```

   Use in widgets:

   ```dart
   // Provide
   BlocProvider(
     create: (context) => AuthBloc(authRepository),
     child: const App(),
   );

   // Consume
   BlocBuilder<AuthBloc, AuthState>(
     builder: (context, state) {
       return switch (state) {
         AuthInitial() => const LoginScreen(),
         AuthLoading() => const LoadingScreen(),
         AuthAuthenticated(:final user) => HomeScreen(user: user),
         AuthError(:final message) => ErrorScreen(message: message),
       };
     },
   );

   // Dispatch events
   context.read<AuthBloc>().add(
     AuthLoginRequested(email: email, password: password),
   );
   ```

   For simpler cases, use **Cubit** (Bloc without events):

   ```dart
   class ThemeCubit extends Cubit<ThemeMode> {
     ThemeCubit() : super(ThemeMode.system);

     void setLight() => emit(ThemeMode.light);
     void setDark() => emit(ThemeMode.dark);
   }
   ```

4. **Provider (legacy).** If the codebase already uses Provider:

   ```dart
   class CartModel extends ChangeNotifier {
     final List<Item> _items = [];

     List<Item> get items => List.unmodifiable(_items);
     int get totalItems => _items.length;

     void add(Item item) {
       _items.add(item);
       notifyListeners();
     }

     void remove(Item item) {
       _items.remove(item);
       notifyListeners();
     }
   }

   // Provide
   ChangeNotifierProvider(
     create: (context) => CartModel(),
     child: const App(),
   );

   // Consume
   Consumer<CartModel>(
     builder: (context, cart, child) {
       return Text('${cart.totalItems} items');
     },
   );
   ```

   Provider works but Riverpod is its spiritual successor with better compile-time safety and testability.

## Key References

- [Riverpod documentation](https://riverpod.dev/)
- [riverpod_generator](https://pub.dev/packages/riverpod_generator)
- [flutter_bloc documentation](https://bloclibrary.dev/)
- [Provider documentation](https://pub.dev/packages/provider)
- [Flutter state management overview](https://docs.flutter.dev/data-and-backend/state-mgmt/options)

## Example Interaction

**User:** "I need to manage a shopping cart that's shared across screens."

**Agent:**
1. Recommends Riverpod for shared state
2. Installs flutter_riverpod and riverpod_generator
3. Creates `CartNotifier` with add, remove, clear methods
4. Wraps app in `ProviderScope`
5. Shows `ref.watch(cartProvider)` in the cart screen
6. Shows `ref.read(cartProvider.notifier).add(item)` from a product screen
7. Adds a badge on the cart icon using `ref.watch(cartProvider).length`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install packages | `mobile_installDependency` | Install Riverpod, Bloc, or Provider packages |
| Check build | `mobile_checkBuildHealth` | Verify project builds after adding state management |

## Common Pitfalls

1. **Using `ref.read` where `ref.watch` is needed** - `ref.read` does not rebuild the widget. Use `ref.watch` in `build()` and `ref.read` only in callbacks (onPressed, onTap).
2. **Forgetting `ProviderScope`** - Without wrapping the app in `ProviderScope`, all Riverpod providers throw at runtime.
3. **Not running `build_runner`** - After changing a `@riverpod` annotated class, you must re-run `dart run build_runner build`. The `.g.dart` file must be regenerated.
4. **Mutating state directly in Bloc** - Never modify `state` directly. Always `emit()` a new state object. States should be immutable.
5. **Overusing global state** - Not everything needs to be in a provider. Form inputs, animation controllers, and ephemeral UI state belong in `setState` or local controllers.
6. **Provider vs Riverpod confusion** - They are different packages by the same author. Riverpod does NOT use `BuildContext` for dependency lookup, making it more testable. Do not mix them.

## See Also

- [Flutter Project Setup](../mobile-flutter-project-setup/SKILL.md) - installing Riverpod during project creation
- [Flutter Navigation](../mobile-flutter-navigation/SKILL.md) - auth state in route guards
- [Mobile State Management (React Native)](../mobile-state-management/SKILL.md) - equivalent patterns for Expo/RN
