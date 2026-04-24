---
name: mobile-forms-validation
description: Build validated forms in a React Native/Expo or Flutter app. Covers React Hook Form with Zod, TextFormField with validators, keyboard avoidance, multi-step wizard forms, accessible error messages, and field-level vs form-level validation. Use when the user needs a login form, registration form, checkout flow, or any data entry screen.
standards-version: 1.6.3
---

# Mobile Forms and Validation

## Trigger

Use this skill when the user:

- Wants to build a form with validation (login, registration, profile edit, checkout)
- Asks about React Hook Form, Zod, Yup, or form validation
- Needs keyboard avoidance, multi-step forms, or dynamic field arrays
- Mentions "form", "validation", "input", "text field", "form wizard", or "keyboard avoiding"
- Wants accessible error messages on form inputs

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Form type**: simple (login), moderate (registration), complex (multi-step wizard)
- **Fields**: list of fields with types and validation rules

## Workflow

1. **Choose a form library.** Options and trade-offs:

   | Library | Framework | Validation | Bundle size | Re-renders |
   |---|---|---|---|---|
   | React Hook Form + Zod | React Native | Schema-based | Small | Minimal |
   | Formik + Yup | React Native | Schema-based | Larger | More |
   | TextFormField + Form | Flutter | Inline validators | Built-in | N/A |

   React Hook Form + Zod is recommended for React Native. It re-renders only changed fields and provides excellent TypeScript inference.

2. **Set up React Hook Form + Zod (Expo).** Install:

   ```bash
   npx expo install react-hook-form @hookform/resolvers zod
   ```

3. **Build a login form.**

   ```tsx
   import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
   import { useForm, Controller } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import { z } from "zod";

   const loginSchema = z.object({
     email: z.string().min(1, "Required").email("Invalid email"),
     password: z.string().min(8, "At least 8 characters"),
   });

   type LoginData = z.infer<typeof loginSchema>;

   export function LoginForm({ onSubmit }: { onSubmit: (data: LoginData) => void }) {
     const { control, handleSubmit, formState: { errors } } = useForm<LoginData>({
       resolver: zodResolver(loginSchema),
     });

     return (
       <View style={styles.form}>
         <Controller
           control={control}
           name="email"
           render={({ field: { onChange, onBlur, value } }) => (
             <View>
               <TextInput
                 style={[styles.input, errors.email && styles.inputError]}
                 onBlur={onBlur}
                 onChangeText={onChange}
                 value={value}
                 placeholder="Email"
                 keyboardType="email-address"
                 autoCapitalize="none"
                 accessibilityLabel="Email"
                 accessibilityHint={errors.email?.message}
               />
               {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
             </View>
           )}
         />

         <Controller
           control={control}
           name="password"
           render={({ field: { onChange, onBlur, value } }) => (
             <View>
               <TextInput
                 style={[styles.input, errors.password && styles.inputError]}
                 onBlur={onBlur}
                 onChangeText={onChange}
                 value={value}
                 placeholder="Password"
                 secureTextEntry
                 accessibilityLabel="Password"
               />
               {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
             </View>
           )}
         />

         <Pressable style={styles.button} onPress={handleSubmit(onSubmit)}>
           <Text style={styles.buttonText}>Sign In</Text>
         </Pressable>
       </View>
     );
   }
   ```

4. **Keyboard avoidance.** Wrap forms in `KeyboardAvoidingView`:

   ```tsx
   import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

   export function FormScreen() {
     return (
       <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         style={{ flex: 1 }}
       >
         <ScrollView contentContainerStyle={{ padding: 16 }}>
           <LoginForm onSubmit={handleLogin} />
         </ScrollView>
       </KeyboardAvoidingView>
     );
   }
   ```

5. **Multi-step wizard form.** Track the current step and validate per step:

   ```tsx
   const steps = [
     z.object({ name: z.string().min(1), email: z.string().email() }),
     z.object({ address: z.string().min(1), city: z.string().min(1) }),
     z.object({ cardNumber: z.string().min(16) }),
   ];

   function WizardForm() {
     const [step, setStep] = useState(0);
     const [formData, setFormData] = useState({});

     const handleStepSubmit = (data: Record<string, string>) => {
       const merged = { ...formData, ...data };
       setFormData(merged);

       if (step < steps.length - 1) {
         setStep(step + 1);
       } else {
         submitFinalForm(merged);
       }
     };

     return <StepForm schema={steps[step]} onSubmit={handleStepSubmit} />;
   }
   ```

6. **Flutter Form with TextFormField.**

   ```dart
   class LoginForm extends StatefulWidget {
     final void Function(String email, String password) onSubmit;
     const LoginForm({super.key, required this.onSubmit});

     @override
     State<LoginForm> createState() => _LoginFormState();
   }

   class _LoginFormState extends State<LoginForm> {
     final _formKey = GlobalKey<FormState>();
     final _emailController = TextEditingController();
     final _passwordController = TextEditingController();

     @override
     void dispose() {
       _emailController.dispose();
       _passwordController.dispose();
       super.dispose();
     }

     @override
     Widget build(BuildContext context) {
       return Form(
         key: _formKey,
         child: Column(
           children: [
             TextFormField(
               controller: _emailController,
               decoration: const InputDecoration(labelText: 'Email'),
               keyboardType: TextInputType.emailAddress,
               validator: (value) {
                 if (value == null || value.isEmpty) return 'Required';
                 if (!value.contains('@')) return 'Invalid email';
                 return null;
               },
             ),
             TextFormField(
               controller: _passwordController,
               decoration: const InputDecoration(labelText: 'Password'),
               obscureText: true,
               validator: (value) {
                 if (value == null || value.length < 8) return 'At least 8 characters';
                 return null;
               },
             ),
             ElevatedButton(
               onPressed: () {
                 if (_formKey.currentState!.validate()) {
                   widget.onSubmit(_emailController.text, _passwordController.text);
                 }
               },
               child: const Text('Sign In'),
             ),
           ],
         ),
       );
     }
   }
   ```

7. **Dynamic field arrays.** Add and remove fields dynamically:

   ```tsx
   import { useFieldArray } from "react-hook-form";

   function DynamicForm() {
     const { control } = useForm({ defaultValues: { items: [{ name: "" }] } });
     const { fields, append, remove } = useFieldArray({ control, name: "items" });

     return (
       <View>
         {fields.map((field, index) => (
           <View key={field.id}>
             <Controller
               control={control}
               name={`items.${index}.name`}
               render={({ field: { onChange, value } }) => (
                 <TextInput onChangeText={onChange} value={value} />
               )}
             />
             <Pressable onPress={() => remove(index)}>
               <Text>Remove</Text>
             </Pressable>
           </View>
         ))}
         <Pressable onPress={() => append({ name: "" })}>
           <Text>Add Item</Text>
         </Pressable>
       </View>
     );
   }
   ```

## Key References

- [React Hook Form](https://react-hook-form.com/)
- [Zod: Schema Validation](https://zod.dev/)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)
- [Flutter: Form](https://docs.flutter.dev/cookbook/forms/validation)

## Example Interaction

**User:** "Build a registration form with email, password, confirm password, and name fields."

**Agent:**
1. Runs `mobile_generateForm` with fields for name, email, password, confirmPassword
2. Adds a Zod refinement to check password === confirmPassword
3. Wraps in `KeyboardAvoidingView` + `ScrollView`
4. Adds accessible error messages with `accessibilityHint`
5. Implements the `onSubmit` handler calling the registration API
6. Adds loading state to disable the button during submission

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Generate form | `mobile_generateForm` | Scaffold a form component with fields and validation |
| Install packages | `mobile_installDependency` | Install react-hook-form, @hookform/resolvers, zod |
| Generate screen | `mobile_generateScreen` | Create a screen to host the form |
| Generate test | `mobile_generateTestFile` | Scaffold tests for form validation logic |

## Common Pitfalls

1. **Validating on every keystroke** - React Hook Form validates on blur by default, which is correct. Validating on change creates a poor UX with errors appearing while the user is still typing.
2. **Not using `Controller`** - React Native `TextInput` is uncontrolled by default. You must use `Controller` from React Hook Form to connect it.
3. **Missing keyboard avoidance** - On iOS, the keyboard covers bottom fields. Always wrap forms in `KeyboardAvoidingView` with `behavior="padding"`.
4. **No accessible error messages** - Screen readers need `accessibilityHint` or `accessibilityLabel` on error text. Do not rely on color alone to indicate errors.
5. **Password confirmation in schema** - Use `.refine()` at the schema level, not field level, to compare password and confirmPassword.
6. **Flutter dispose** - Forgetting to dispose `TextEditingController` instances causes memory leaks.

## See Also

- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - login and registration form submission
- [Mobile I18n](../mobile-i18n/SKILL.md) - localized validation error messages
- [Mobile Accessibility](../../rules/mobile-accessibility.mdc) - accessible form labels and error announcements
- [Mobile Component Patterns](../mobile-component-patterns/SKILL.md) - reusable form field components
