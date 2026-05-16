import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@autoprint/jfx-modena-components": fileURLToPath(new URL("../../src/index.ts", import.meta.url)),
      "@autoprint/jfx-modena-design-system": fileURLToPath(new URL("../../../design-system/src/index.ts", import.meta.url)),
      "@autoprint/jfx-modena-runtime": fileURLToPath(new URL("../../../runtime/src/index.ts", import.meta.url)),
    },
  },
});
