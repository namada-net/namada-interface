/* eslint-disable */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  return {
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
    },
    plugins: [
      VitePWA({
        srcDir: "src",
        filename: "sw.ts",
        strategies: "injectManifest",
        injectRegister: false,
        manifest: false,
        injectManifest: {
          injectionPoint: undefined,
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
      react(),
      tsconfigPaths(),
      checker({
        typescript: true,
        eslint: { lintCommand: 'eslint "./src/**/*.{ts,tsx}"' },
        overlay: { initialIsOpen: false },
      }),
    ],
    worker: {
      plugins: () => [tsconfigPaths()],
      format: "es",
    },
    resolve: {
      alias: {
        buffer: "buffer",
        process: "process/browser",
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: "globalThis",
        },
      },
    },
    build: {
      commonjsOptions: { transformMixedEsModules: true }, // Change
    },
  };
});
