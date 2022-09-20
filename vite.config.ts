import { defineConfig } from "vite";
import { resolve as pathResolve } from "path";
import resolve from '@rollup/plugin-node-resolve';
//n import postcss from 'rollup-plugin-postcss';
import litcss from 'rollup-plugin-postcss-lit';
//import postcssLit from 'rollup-plugin-postcss-lit';


export default defineConfig({
  base: "/lit-code-editor/",
  // add this line for server
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000/api/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
       input: {
         main: pathResolve(__dirname, "index.html"),
       },
      //input: 'src/main-app.ts',
      output: [
        {
          dir: 'types',
          format: 'es',
          sourcemap: true,
        }
      ],
    },
  },
  plugins: [
    resolve({
      browser: true,
    }),
    // postcss({
    //   minimize: false,
    //   inject: false
    // }),
    litcss(),
  ],
});
