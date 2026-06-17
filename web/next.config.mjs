import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Prevents Next.js from walking up to the monorepo root when tracing files
  outputFileTracingRoot: path.resolve(__dirname, ".."),
};
