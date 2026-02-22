import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: [".next/**", "node_modules/**", ".next-env.d.ts", "out/**", "build/**"],
    },
    ...compat.extends("next/core-web-vitals", "next/typescript"), 
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                ignoreRestSiblings: true,
            }],
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-unsafe-function-type": "warn",
            "react/no-unescaped-entities": "off",
            "@typescript-eslint/ban-types": "off",
            "react-hooks/exhaustive-deps": "warn",
            "jsx-a11y/alt-text": "warn",
        },
    }
];
