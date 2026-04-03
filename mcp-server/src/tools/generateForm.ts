import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const fieldSchema = z.object({
  name: z.string().describe("Field name in camelCase (e.g. 'email', 'firstName')."),
  type: z
    .enum(["text", "email", "password", "number", "phone", "textarea", "select"])
    .describe("Field input type."),
  label: z.string().describe("Display label for the field."),
  required: z.boolean().optional().default(true).describe("Whether the field is required."),
  placeholder: z.string().optional().describe("Placeholder text."),
});

const inputSchema = {
  form_name: z
    .string()
    .describe("Form component name in PascalCase (e.g. 'LoginForm', 'ContactForm')."),
  fields: z
    .array(fieldSchema)
    .min(1)
    .describe("Array of field definitions."),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Project framework (default: expo)."),
  output_directory: z
    .string()
    .optional()
    .default("components")
    .describe("Output directory relative to project root (default: components)."),
};

interface FieldDef {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

function zodValidation(field: FieldDef): string {
  let chain = "z.string()";
  if (field.required) chain += '.min(1, "Required")';
  if (field.type === "email") chain += '.email("Invalid email")';
  if (field.type === "number") chain = "z.coerce.number()";
  if (field.type === "phone") chain += '.regex(/^\\+?[0-9\\s-()]+$/, "Invalid phone number")';
  if (field.type === "password") chain += '.min(8, "At least 8 characters")';
  return chain;
}

function rnInputType(type: string): string {
  switch (type) {
    case "email": return "email-address";
    case "number": return "numeric";
    case "phone": return "phone-pad";
    default: return "default";
  }
}

function generateExpoForm(name: string, fields: FieldDef[]): string {
  const schemaFields = fields
    .map((f) => `  ${f.name}: ${zodValidation(f)},`)
    .join("\n");

  const formFields = fields
    .map((f) => {
      const secureEntry = f.type === "password" ? "\n          secureTextEntry" : "";
      const multiline = f.type === "textarea" ? "\n          multiline\n          numberOfLines={4}" : "";
      const keyboard = f.type !== "text" && f.type !== "password" && f.type !== "textarea" && f.type !== "select"
        ? `\n          keyboardType="${rnInputType(f.type)}"`
        : "";
      return `        <View style={styles.field}>
          <Text style={styles.label}>${f.label}</Text>
          <Controller
            control={control}
            name="${f.name}"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.${f.name} && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="${f.placeholder || f.label}"${secureEntry}${multiline}${keyboard}
              />
            )}
          />
          {errors.${f.name} && (
            <Text style={styles.error}>{errors.${f.name}?.message}</Text>
          )}
        </View>`;
    })
    .join("\n\n");

  const defaultValues = fields
    .map((f) => `    ${f.name}: "",`)
    .join("\n");

  return `import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
${schemaFields}
});

type FormData = z.infer<typeof schema>;

interface ${name}Props {
  onSubmit: (data: FormData) => void;
}

export function ${name}({ onSubmit }: ${name}Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
${defaultValues}
    },
  });

  return (
    <View style={styles.container}>
${formFields}

        <Pressable
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Text>
        </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  error: {
    color: "#dc2626",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#0A84FF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
`;
}

function generateFlutterForm(name: string, fields: FieldDef[]): string {
  const className = name.charAt(0).toUpperCase() + name.slice(1);
  const controllers = fields
    .map((f) => `  final _${f.name}Controller = TextEditingController();`)
    .join("\n");

  const disposeControllers = fields
    .map((f) => `    _${f.name}Controller.dispose();`)
    .join("\n");

  const formFields = fields
    .map((f) => {
      const obscure = f.type === "password" ? "\n              obscureText: true," : "";
      const maxLines = f.type === "textarea" ? "\n              maxLines: 4," : "";
      const keyboard = f.type === "email"
        ? "\n              keyboardType: TextInputType.emailAddress,"
        : f.type === "number"
          ? "\n              keyboardType: TextInputType.number,"
          : f.type === "phone"
            ? "\n              keyboardType: TextInputType.phone,"
            : "";
      const validator = f.required
        ? `\n              validator: (value) {\n                if (value == null || value.isEmpty) return '${f.label} is required';\n                return null;\n              },`
        : "";
      return `            TextFormField(
              controller: _${f.name}Controller,
              decoration: const InputDecoration(
                labelText: '${f.label}',
                hintText: '${f.placeholder || f.label}',
              ),${obscure}${maxLines}${keyboard}${validator}
            ),
            const SizedBox(height: 16),`;
    })
    .join("\n");

  return `import 'package:flutter/material.dart';

class ${className} extends StatefulWidget {
  final void Function(Map<String, String> data) onSubmit;

  const ${className}({super.key, required this.onSubmit});

  @override
  State<${className}> createState() => _${className}State();
}

class _${className}State extends State<${className}> {
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

${controllers}

  @override
  void dispose() {
${disposeControllers}
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      widget.onSubmit({
${fields.map((f) => `        '${f.name}': _${f.name}Controller.text,`).join("\n")}
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
${formFields}
            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              child: Text(_isSubmitting ? 'Submitting...' : 'Submit'),
            ),
          ],
        ),
      ),
    );
  }
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_generateForm",
    "Scaffold a validated form component with typed fields, validation rules, and error handling. Uses React Hook Form + Zod for Expo or Form + TextFormField for Flutter.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const outDir = join(root, args.output_directory);
        mkdirSync(outDir, { recursive: true });

        const fields: FieldDef[] = args.fields.map((f) => ({
          name: f.name,
          type: f.type,
          label: f.label,
          required: f.required,
          placeholder: f.placeholder,
        }));

        if (args.framework === "flutter") {
          const fileName = args.form_name
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase()
            .replace(/^_/, "");
          const filePath = join(outDir, `${fileName}.dart`);

          if (existsSync(filePath)) {
            return errorResponse(new Error(`File already exists: ${filePath}`));
          }

          writeFileSync(filePath, generateFlutterForm(args.form_name, fields), "utf-8");

          return textResponse(
            JSON.stringify(
              {
                success: true,
                framework: "flutter",
                file_created: filePath,
                form_name: args.form_name,
                fields: fields.map((f) => f.name),
                next_steps: [
                  "Import and use the form widget in your screen",
                  "Add email/phone validators if needed",
                  "Add keyboard avoidance with SingleChildScrollView",
                ],
              },
              null,
              2,
            ),
          );
        }

        const filePath = join(outDir, `${args.form_name}.tsx`);
        if (existsSync(filePath)) {
          return errorResponse(new Error(`File already exists: ${filePath}`));
        }

        writeFileSync(filePath, generateExpoForm(args.form_name, fields), "utf-8");

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: "expo",
              file_created: filePath,
              form_name: args.form_name,
              fields: fields.map((f) => f.name),
              dependencies_needed: [
                "react-hook-form",
                "@hookform/resolvers",
                "zod",
              ],
              next_steps: [
                "Install dependencies: npx expo install react-hook-form @hookform/resolvers zod",
                "Import and render the form in your screen",
                "Implement the onSubmit handler with your API call",
                "Add KeyboardAvoidingView wrapper if fields are below the fold",
              ],
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}
