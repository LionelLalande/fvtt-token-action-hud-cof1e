import * as Vite from 'vite';
import fs from 'fs-extra';
import path from 'path';

const config = Vite.defineConfig(async ({ command, mode }): Promise<Vite.UserConfig> => {
  const packageJson = await fs.readJSON('./package.json');
  const moduleName = packageJson.name;
  const buildMode = mode === 'production' ? 'production' : 'development';

  // Create dummy files for vite dev server
  if (command === 'serve') {
    const message = 'This file is for a running vite dev server and is not copied to a build';
    fs.writeFileSync('./index.html', `<h1>${message}</h1>\n`);
    fs.writeFileSync('./dist/styles.css', `/** ${message} */\n`);
    fs.writeFileSync('./dist/index.esm.js', `/** ${message} */\n\nimport "./src/index.ts";\n`);
  }

  return {
    root: 'src/',
    base: `/modules/${moduleName}/`,
    publicDir: 'src/',
    ////resolve: {
    ////    alias: [],
    ////},
    css: {
      postcss: {},
    },
    define: {
      BUILD_MODE: JSON.stringify(buildMode),
    },
    esbuild: { keepNames: true },
    build: {
      emptyOutDir: buildMode === 'development',
      outDir: path.resolve(__dirname, 'dist/'),
      sourcemap: true,
      lib: {
        name: 'co',
        entry: path.resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index.esm',
      },
    },
    server: {
      port: 30001,
      open: true,
      proxy: {
        [`^(?!/modules/${moduleName}/.+)`]: 'http://localhost:30000/',
        [`^/modules/${moduleName}/index.esm.js`]: 'http://localhost:30000/',
        [`^/modules/${moduleName}/styles.css`]: 'http://localhost:30000/',
        [`^/modules/${moduleName}/langs/.+\.json`]: 'http://localhost:30000/',
        [`^/modules/${moduleName}/.+/.+\.hbs`]: 'http://localhost:30000/',
        '/socket.io': {
          target: 'ws://localhost:30000',
          ws: true,
        },
      },
    },
    plugins: [],
  };
});

export default config;
