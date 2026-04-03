import { useState } from "react";

const SECTIONS = [
  {
    id: "overview",
    title: "Product Overview",
    content: `**Mobile-App-Developer-Tools** is an open-source Cursor plugin, MCP server, and NPM package that helps developers go from zero to a running mobile app on their phone. It supports both React Native/Expo and Flutter, with a shared core architecture and framework-specific skill modules.

**The pitch:** The first 30 minutes of mobile development is broken. You're Googling "how to set up Expo," fighting simulator configs, wondering why your app won't hot-reload on your phone, and drowning in framework choices before you've written a single line of business logic. This toolkit eliminates that friction by giving your AI coding assistant deep mobile dev knowledge through skills, guardrails through rules, and real actions through MCP tools.

**Open source strategy:** The toolkit itself is free and open source. It builds your reputation, grows an audience through your build-in-public content, and creates distribution for your paid mobile apps (the real revenue driver). If the toolkit gets traction, optional premium features (hosted MCP, managed CI/CD templates, premium skills for app store optimization) become natural upsells.

**Repo:** github.com/TMHSDigital/Mobile-App-Developer-Tools
**Follows the pattern of:** Plaid-Developer-Tools, Docker-Developer-Tools, Steam-Cursor-Plugin`,
  },
  {
    id: "architecture",
    title: "Architecture",
    content: `The repo follows the same proven structure from your Plaid and Steam tools:

\`\`\`
Mobile-App-Developer-Tools/
├── .cursor-plugin/
│   └── plugin.json
├── mcp-server/              # TypeScript MCP server
│   ├── src/
│   │   ├── tools/
│   │   │   ├── shared/      # Framework-agnostic tools
│   │   │   ├── expo/        # Expo-specific tools
│   │   │   └── flutter/     # Flutter-specific tools
│   │   └── index.ts
│   └── package.json
├── skills/                  # Agent skill definitions
│   ├── shared/              # Cross-framework skills
│   ├── expo/                # Expo-specific skills
│   └── flutter/             # Flutter-specific skills
├── rules/                   # Editor guardrails
├── packages/
│   └── mobile-dev-tools/    # NPM package (shared utilities)
│       └── package.json
├── templates/               # Starter templates
│   ├── expo/
│   └── flutter/
├── docs/
├── CLAUDE.md
├── .cursorrules
├── ROADMAP.md
└── README.md
\`\`\`

**Key design decision:** The shared/ directories contain framework-agnostic logic (app store submission, deep linking concepts, push notification architecture). The expo/ and flutter/ directories contain framework-specific implementations. This lets you ship Expo support first (since it matches your TS skills) and add Flutter later without restructuring.`,
  },
  {
    id: "skills",
    title: "Skills (Phase 1-3)",
    content: `**Phase 1 -- Zero to Phone (8 skills)**

| Skill | Framework | What it does |
|-------|-----------|-------------|
| mobile-project-setup | Expo | Guided "create new app" with opinionated defaults (TypeScript, file-based routing, ESLint) |
| mobile-project-setup | Flutter | Guided "flutter create" with recommended structure |
| mobile-dev-environment | Shared | Detects OS, checks dependencies (Node, Watchman, Xcode, Android Studio), fixes common issues |
| mobile-run-on-device | Expo | Step-by-step for running on physical device via Expo Go and dev builds |
| mobile-run-on-device | Flutter | Step-by-step for USB debugging and wireless deploy |
| mobile-navigation-setup | Expo | Expo Router file-based navigation patterns |
| mobile-navigation-setup | Flutter | GoRouter or Navigator 2.0 patterns |
| mobile-state-management | Shared | Guides framework-appropriate state management (Zustand/Jotai for RN, Riverpod/Bloc for Flutter) |

**Phase 2 -- Core Features (8 skills)**

| Skill | Framework | What it does |
|-------|-----------|-------------|
| mobile-camera-integration | Expo | expo-camera setup, permissions, photo capture, AI vision pipeline |
| mobile-camera-integration | Flutter | camera plugin setup, permissions, image capture |
| mobile-auth-setup | Shared | Auth patterns (Supabase, Firebase, Clerk) with secure token storage |
| mobile-push-notifications | Expo | expo-notifications + EAS push service |
| mobile-push-notifications | Flutter | firebase_messaging setup |
| mobile-local-storage | Shared | Async storage, SQLite, encrypted storage patterns |
| mobile-api-integration | Shared | REST/GraphQL client setup, caching, offline-first patterns |
| mobile-ai-features | Shared | Integrating AI APIs (vision, text, audio) into mobile apps |

**Phase 3 -- Ship It (6 skills)**

| Skill | Framework | What it does |
|-------|-----------|-------------|
| mobile-app-store-prep | Shared | Screenshots, descriptions, metadata, review guidelines |
| mobile-ios-submission | Expo | EAS Submit for iOS, certificates, provisioning profiles |
| mobile-ios-submission | Flutter | Xcode archive, App Store Connect |
| mobile-android-submission | Expo | EAS Submit for Android, signing keys |
| mobile-android-submission | Flutter | Play Console upload, signing |
| mobile-monetization | Shared | In-app purchases, subscriptions, credit-based pricing, RevenueCat integration |`,
  },
  {
    id: "rules",
    title: "Rules (Guardrails)",
    content: `Rules fire automatically while coding to prevent common mobile dev mistakes.

| Rule | Scope | What it catches |
|------|-------|----------------|
| mobile-secrets | Always on | API keys, signing credentials, or tokens hardcoded in source |
| mobile-permissions | AndroidManifest, Info.plist | Missing or overly broad permission declarations |
| mobile-platform-check | *.ts, *.tsx, *.dart | Platform-specific code without proper Platform.OS checks |
| mobile-image-assets | assets/ | Oversized images that will bloat the app bundle |
| mobile-env-safety | .env*, config | Production API endpoints in development builds |
| mobile-performance | Components | Common performance anti-patterns (inline styles in FlatList, missing keys, heavy re-renders) |
| mobile-accessibility | UI components | Missing accessibility labels, touch targets below 44x44pt |

These map closely to the rule structure in your Plaid tools (plaid-secrets, plaid-env-safety, etc.) so the implementation pattern is familiar.`,
  },
  {
    id: "mcp-tools",
    title: "MCP Tools",
    content: `MCP tools give the AI assistant the ability to take real actions, not just give advice.

**Environment & Setup (6 tools)**

| Tool | Purpose |
|------|---------|
| checkDevEnvironment | Detect installed tools, SDKs, simulators; report what's missing |
| scaffoldProject | Generate a new project from templates with chosen options |
| runOnDevice | Start dev server, connect to physical device or simulator |
| installDependency | Add and configure a library (handles linking, pod install, etc.) |
| checkBuildHealth | Verify the project builds cleanly before you get deep into features |
| resetDevEnvironment | Nuclear option: clear caches, reinstall pods, reset Metro/Gradle |

**Development (6 tools)**

| Tool | Purpose |
|------|---------|
| generateScreen | Create a new screen with navigation wiring already done |
| generateComponent | Create a component with props, styles, and optional tests |
| addPermission | Add platform permissions with rationale strings |
| configureDeepLinks | Set up universal links (iOS) and app links (Android) |
| addPushNotifications | Wire up push notification service end-to-end |
| integrateAI | Add AI API integration (vision, text) with proper error handling |

**Build & Ship (6 tools)**

| Tool | Purpose |
|------|---------|
| buildForStore | Create production build (EAS Build or flutter build) |
| generateScreenshots | Capture screenshots at required App Store dimensions |
| validateStoreMetadata | Check that all required store listing fields are filled |
| submitToAppStore | Trigger submission via EAS Submit or xcrun |
| submitToPlayStore | Trigger submission via EAS Submit or bundletool |
| analyzeBundle | Check app size, identify bloat, suggest optimizations |

**Total: 18 tools at v1.0** (comparable to your Plaid toolkit's 30 tools)`,
  },
  {
    id: "npm-package",
    title: "NPM Package",
    content: `The NPM package (@tmhsdigital/mobile-dev-tools) provides shared utilities that both the MCP server and end users can consume directly.

**What it includes:**

- **Template engine:** Programmatic project scaffolding with framework detection
- **Environment checker:** Cross-platform dependency detection (Node, Xcode, Android SDK, etc.)
- **Config generators:** Standard configs for ESLint, Prettier, TypeScript, app.json/pubspec.yaml
- **Store metadata validator:** Validates screenshots, descriptions, and required fields against current App Store and Play Store requirements
- **Asset pipeline helpers:** Image resizing for different screen densities, app icon generation from a single source

**Why a separate package:** It lets developers use the utilities outside of Cursor. Someone using VS Code, Windsurf, or even just a terminal can still benefit. It also becomes the shared dependency that the MCP server imports, keeping the architecture clean.

\`\`\`bash
npm install -g @tmhsdigital/mobile-dev-tools

# CLI usage
mobile-dev check-env
mobile-dev scaffold --framework expo --template ai-camera
mobile-dev validate-store --platform ios
\`\`\``,
  },
  {
    id: "roadmap",
    title: "Roadmap (Tied to Your App Build)",
    content: `Each phase of the toolkit maps to a milestone in building your first mobile app. You build the app, hit friction, build the tool that solves that friction, and document the whole thing publicly.

| Version | Toolkit Focus | Your App Milestone | Content Angle |
|---------|--------------|-------------------|---------------|
| **v0.1.0** | Project scaffolding, env check, run-on-device skill, secrets rule | App runs on your phone for the first time | "I built a toolkit because getting an app on my phone was absurd" |
| **v0.2.0** | Navigation, state management, component generation skills + tools | App has multiple screens with shared state | "Navigation in mobile dev is a maze. I built a guide." |
| **v0.3.0** | Camera integration, AI features, permissions skills + tools | App can take photos and send them to an AI API | "Adding AI vision to a mobile app (the hard parts nobody talks about)" |
| **v0.4.0** | Auth, push notifications, local storage skills | App has user accounts and notifications | "Auth on mobile is different from web. Here's what I learned." |
| **v0.5.0** | Flutter support begins (shared core, Flutter-specific skills) | (Toolkit expansion, app is feature-complete) | "Porting my toolkit to support Flutter: what transferred and what didn't" |
| **v0.6.0** | App store prep, submission tools, monetization skill | App submitted to both stores | "Submitting my first app: the 47 things that surprised me" |
| **v1.0.0** | Polish, 22 skills, 7 rules, 18 MCP tools stable | App is live and generating revenue | "From zero to app store: the full story" |

**Timeline estimate:** v0.1.0 in 1-2 weeks, v1.0.0 in 3-4 months if you're building consistently.`,
  },
  {
    id: "build-in-public",
    title: "Build in Public Strategy",
    content: `Your build-in-public content has two audiences that you serve simultaneously:

**Audience 1: Developers** who want to build mobile apps with AI coding tools. They follow for the toolkit updates, the raw learning journal, and the practical advice. Distribution: GitHub (primary), Twitter/X (clips and threads), YouTube (longer walkthroughs).

**Audience 2: Indie hackers / app builders** who want to find and validate app ideas. They follow for the Greg Isenberg framework application, the niche research, and the revenue updates. Distribution: Twitter/X, YouTube, maybe IndieHackers.

**Content cadence:**

- GitHub: Every commit, every release, every CHANGELOG update. The repo IS the content.
- Weekly thread/post: What you built this week, what broke, what the toolkit solved.
- Milestone videos: At each version release, a walkthrough of what the toolkit does and how your app progressed.
- Monthly revenue/metrics update: Once the app launches, share real numbers. This is what gets reshared.

**The flywheel:** Toolkit gets attention from devs. App gets attention from indie hackers. Each audience cross-pollinates. Toolkit users build apps that validate the toolkit works. Your app revenue validates the framework. The content documents all of it.`,
  },
  {
    id: "first-steps",
    title: "Recommended First Steps",
    content: `Here's what I'd suggest doing this week:

**1. Pick your first app from the brainstorm.** My recommendation: start with WasteWatch or PlateCheck. Both leverage your deepest domain knowledge, use the camera-to-AI pipeline (which is the hardest mobile dev skill to build and therefore the most valuable to toolkit-ify), and have clear revenue potential.

**2. Create the GitHub repo.** Mobile-App-Developer-Tools, CC-BY-NC-ND-4.0 license (matching your other repos), standard structure with .cursor-plugin/, skills/, rules/, mcp-server/.

**3. Start with v0.1.0 scope only.** That means: one scaffolding skill (Expo), the env check tool, the run-on-device skill, and the secrets rule. Get YOUR app running on YOUR phone using YOUR toolkit.

**4. Document the pain.** Every time something is confusing, write it down. That confusion becomes a skill or tool in the toolkit. Your frustration is literally the product spec.

**5. Ship the first GitHub release when your app runs on your phone.** That's v0.1.0. Write the thread. Post the video. You're building in public now.

Don't try to build the whole toolkit first and then the app. Build them in lockstep. The app is the test suite for the toolkit.`,
  },
];

function SectionNav({ sections, activeId, onSelect }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: "200px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(190,175,140,0.5)",
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          marginBottom: "8px",
          paddingLeft: "12px",
        }}
      >
        Sections
      </div>
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            background: activeId === s.id ? "rgba(190,175,140,0.1)" : "transparent",
            border: "none",
            borderLeft: activeId === s.id ? "2px solid #bEAf8c" : "2px solid transparent",
            color: activeId === s.id ? "#e8e0d0" : "rgba(232,224,208,0.45)",
            padding: "8px 12px",
            fontSize: "12px",
            fontFamily: "'IBM Plex Sans', sans-serif",
            textAlign: "left",
            cursor: "pointer",
            borderRadius: "0 4px 4px 0",
            transition: "all 0.15s ease",
            lineHeight: 1.4,
          }}
        >
          {s.title}
        </button>
      ))}
    </nav>
  );
}

function MarkdownContent({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let tableRows = [];
  let inTable = false;

  const parseInline = (str) => {
    const parts = [];
    const regex = /(\*\*(.+?)\*\*)|(`([^`]+?)`)|(\[(.+?)\]\((.+?)\))/g;
    let last = 0;
    let m;
    while ((m = regex.exec(str)) !== null) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      if (m[1])
        parts.push(
          <strong key={m.index} style={{ color: "#e8e0d0", fontWeight: 600 }}>
            {m[2]}
          </strong>
        );
      else if (m[3])
        parts.push(
          <code
            key={m.index}
            style={{
              backgroundColor: "rgba(190,175,140,0.1)",
              padding: "1px 5px",
              borderRadius: "3px",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#bEAf8c",
            }}
          >
            {m[4]}
          </code>
        );
      else if (m[5])
        parts.push(
          <span key={m.index} style={{ color: "#bEAf8c", textDecoration: "underline" }}>
            {m[6]}
          </span>
        );
      last = regex.lastIndex;
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts;
  };

  const flushTable = () => {
    if (tableRows.length < 2) return null;
    const headers = tableRows[0]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    const dataRows = tableRows.slice(2).map((r) =>
      r
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean)
    );
    tableRows = [];
    inTable = false;
    return (
      <div
        key={`table-${i}`}
        style={{
          overflowX: "auto",
          margin: "12px 0",
          border: "1px solid rgba(190,175,140,0.12)",
          borderRadius: "6px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          <thead>
            <tr>
              {headers.map((h, hi) => (
                <th
                  key={hi}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    borderBottom: "1px solid rgba(190,175,140,0.15)",
                    color: "#bEAf8c",
                    fontWeight: 600,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: "rgba(190,175,140,0.05)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: "7px 12px",
                      borderBottom:
                        ri < dataRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      color: "rgba(232,224,208,0.75)",
                      lineHeight: 1.5,
                    }}
                  >
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("|") || (inTable && line.trim().startsWith("|"))) {
      inTable = true;
      tableRows.push(line);
      i++;
      if (i >= lines.length || !lines[i].trim().startsWith("|")) {
        elements.push(flushTable());
      }
      continue;
    }

    if (inTable) {
      elements.push(flushTable());
    }

    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={`code-${i}`}
          style={{
            backgroundColor: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(190,175,140,0.1)",
            borderRadius: "6px",
            padding: "14px 16px",
            overflowX: "auto",
            fontSize: "12px",
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
            color: "rgba(232,224,208,0.8)",
            margin: "12px 0",
          }}
        >
          {codeLines.join("\n")}
        </pre>
      );
      i++;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("- ")) {
      elements.push(
        <div key={`li-${i}`} style={{ display: "flex", gap: "8px", margin: "4px 0", paddingLeft: "4px" }}>
          <span style={{ color: "rgba(190,175,140,0.4)", flexShrink: 0 }}>-</span>
          <span style={{ color: "rgba(232,224,208,0.75)", fontSize: "14px", lineHeight: 1.65, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {parseInline(line.slice(2))}
          </span>
        </div>
      );
      i++;
      continue;
    }

    elements.push(
      <p
        key={`p-${i}`}
        style={{
          margin: "10px 0",
          fontSize: "14px",
          lineHeight: 1.7,
          color: "rgba(232,224,208,0.75)",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        {parseInline(line)}
      </p>
    );
    i++;
  }

  if (inTable) elements.push(flushTable());

  return <div>{elements}</div>;
}

export default function ToolkitConcept() {
  const [activeSection, setActiveSection] = useState("overview");
  const section = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0e0e0d",
        color: "#e8e0d0",
        fontFamily: "'IBM Plex Sans', sans-serif",
        padding: "32px 20px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#bEAf8c",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: "8px",
            }}
          >
            Product Concept Document
          </div>
          <h1
            style={{
              margin: "0 0 6px 0",
              fontSize: "26px",
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            Mobile-App-Developer-Tools
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(232,224,208,0.45)" }}>
            Cursor plugin + MCP server + NPM package for mobile app development
          </p>
        </div>

        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          <div style={{ display: "none" }}>
            {/* Hide nav on very small screens */}
          </div>
          <div className="section-nav" style={{ flexShrink: 0 }}>
            <SectionNav sections={SECTIONS} activeId={activeSection} onSelect={setActiveSection} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(190,175,140,0.1)",
                borderRadius: "10px",
                padding: "28px 28px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "20px",
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  color: "#e8e0d0",
                  letterSpacing: "-0.3px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid rgba(190,175,140,0.1)",
                }}
              >
                {section.title}
              </h2>
              <MarkdownContent text={section.content} />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "16px",
                gap: "8px",
              }}
            >
              {SECTIONS.findIndex((s) => s.id === activeSection) > 0 && (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                    setActiveSection(SECTIONS[idx - 1].id);
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: "rgba(190,175,140,0.08)",
                    color: "#bEAf8c",
                    border: "1px solid rgba(190,175,140,0.2)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Prev
                </button>
              )}
              <div style={{ flex: 1 }} />
              {SECTIONS.findIndex((s) => s.id === activeSection) < SECTIONS.length - 1 && (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                    setActiveSection(SECTIONS[idx + 1].id);
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: "rgba(190,175,140,0.08)",
                    color: "#bEAf8c",
                    border: "1px solid rgba(190,175,140,0.2)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .section-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
