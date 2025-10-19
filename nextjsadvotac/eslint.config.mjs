import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable the rule that requires Link components for internal navigation
      // These are older pages that will be migrated later
      "@next/next/no-html-link-for-pages": "off",
      // Allow img tags (will optimize images later)
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
