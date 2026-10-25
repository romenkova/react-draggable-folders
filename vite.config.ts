import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import pkg from "./package.json" with { type: "json" }

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
]

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rolldownOptions: {
      // Subpaths too, like react/jsx-runtime
      external: (id) =>
        external.some((name) => id === name || id.startsWith(`${name}/`)),
    },
  },
})
