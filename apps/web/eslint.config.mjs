import unusedImports from "eslint-plugin-unused-imports";

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      "build/**/*",
      ".vercel/**/*",
      "coverage/**/*",
      "playwright-report/**/*",
      "test-results/**/*",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.json"],
          alwaysTryTypes: true,
        },
        node: true,
      },
    },
    rules: {
      // Console logs: error (allow warn/error)
      "no-console": ["error", { allow: ["warn", "error"] }],

      // "Warn me on warning": produce a *warning* when console.warn is used
      "no-restricted-properties": [
        "warn",
        { object: "console", property: "warn", message: "Avoid console.warn" },
      ],

      // Unused imports: error (fail CI/build if lint runs)
      "unused-imports/no-unused-imports": "error",
      // Delegate unused vars handling to plugin; ignore leading underscores
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Duplicate imports: error
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      // Avoid self-imports, which often show up in cycle refactors
      "import/no-self-import": "error",

      // Prevent import cycles
      "import/no-cycle": ["error", { ignoreExternal: true, maxDepth: Infinity }],

      // Design system: no hardcoded route strings in href — use ROUTES constants
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXAttribute[name.name='href'] > TemplateLiteral",
          message: "Use ROUTES constants from @/app/_libs/constants/routes — avoid template literals for paths.",
        },
      ],

      // Accessibility: downgrade some jsx-a11y rules from error to warn
      // (strict rules that may need gradual adoption)
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
    },
  },
];

export default eslintConfig;
