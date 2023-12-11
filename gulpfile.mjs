import fs from 'fs-extra';
import gulp from 'gulp';
import sass from 'gulp-dart-sass';
import vite from 'gulp-vite';
import yaml from 'gulp-yaml';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const packageJson = await fs.readJSON('./package.json');

/**
 * Build JSON files from YAML files.
 */
function buildStaticJsonFiles() {
  return gulp
    .src(['src/**/*.yml', 'src/**/*.yaml'])
    .pipe(yaml({ schema: 'DEFAULT_SAFE_SCHEMA', space: 2 }))
    .pipe(gulp.dest('dist'));
}

/**
 * Build style sheets
 */
function buildStyles() {
  return gulp.src(`src/styles.scss`).pipe(sass().on('error', sass.logError)).pipe(gulp.dest('dist'));
}

/**
 * Copy all handlebar templates
 */
function copyTemplates() {
  return gulp.src('src/**/*.hbs').pipe(gulp.dest('dist'));
}

/**
 * Copy all handlebar templates
 */
function copyAssets() {
  return gulp.src('assets/**/*').pipe(gulp.dest('dist/assets'));
}

export const build = gulp.series(clean, gulp.parallel(buildStyles, buildStaticJsonFiles, copyTemplates, copyAssets));

/**
 * Watch for changes for each build step
 */
export function watch() {
  gulp.watch(['src/**/*.yml'], { ignoreInitial: false }, buildStaticJsonFiles);
  gulp.watch('src/**/*.hbs', { ignoreInitial: false }, copyTemplates);
}

function runViteDev() {
  return vite.init({
    build: {
      // Do not clean dist when calling from Gulp
      //emptyOutDir: false,
    },
  });
}

export const dev = gulp.series(build, link, gulp.parallel(watch, runViteDev));

/**
 * Remove built files from `dist` folder while ignoring source files
 * @returns: Promise<void>
 */
export async function clean() {
  return fs.emptyDir('dist');
}

/********************/
/*       LINK       */
/********************/

/**
 * Get the path to `foundryconfig.json` or `foundryconfig.{OS}.json`
 * @returns Promise<string>
 */
async function getFoundryConfigPath() {
  const searchPaths = ['foundryconfig.json'];
  if (await fs.exists('C:\\Windows')) searchPaths.push('foundryconfig.windows.json');
  else searchPaths.push('foundryconfig.linux.json');

  for (const path of searchPaths) {
    if (await fs.exists('./' + path)) return path;
  }

  throw new Error('No foundryconfig.json found.');
}

/**
 * Get the data paths of Foundry VTT based on what is configured in `foundryconfig.json` or `foundryconfig.{OS}.json`
 * @return Promise<string[]>
 */
async function getDataPaths() {
  const configPath = await getFoundryConfigPath();
  const config = await fs.readJSON(configPath);
  const dataPath = config?.dataPath;
  if (!dataPath) throw new Error(`No dataPath defined in ${configPath}.`);

  const dataPaths = Array.isArray(dataPath) ? dataPath : [dataPath];

  return dataPaths.map((dataPath) => {
    if (typeof dataPath !== 'string') {
      throw new Error(
        `Property dataPath in foundryconfig.json is expected to be a string or an array of strings, but found ${dataPath}.`,
      );
    }
    dataPath = dataPath.replace('%LOCALAPPDATA%', process.env.localappdata);
    if (!fs.existsSync(path.resolve(dataPath))) {
      throw new Error(`The dataPath ${dataPath} does not exist on the file system`);
    }
    return path.resolve(dataPath);
  });
}

/**
 * Link build to User Data folder
 * @returns: Promise<void>
 */
export async function link() {
  let destinationDirectory;
  if (fs.existsSync(path.resolve('src', 'system.json'))) {
    destinationDirectory = 'systems';
  } else if (fs.existsSync(path.resolve('src', 'system.yml'))) {
    destinationDirectory = 'systems';
  } else if (fs.existsSync(path.resolve('src', 'module.json'))) {
    destinationDirectory = 'modules';
  } else if (fs.existsSync(path.resolve('src', 'module.yml'))) {
    destinationDirectory = 'modules';
  } else {
    throw new Error('Could not find either system.{json,yml} nor module.{json,yml}');
  }

  const dataPaths = await getDataPaths();
  const linkDirectories = dataPaths.map((dataPath) =>
    path.resolve(dataPath, 'Data', destinationDirectory, packageJson.name),
  );

  const argv = yargs(hideBin(process.argv)).options({
    clean: { type: 'boolean', default: false },
  }).argv;
  const clean = argv.clean;

  for (const linkDirectory of linkDirectories) {
    if (clean) {
      console.log(`Removing build in ${linkDirectory}.`);
      await fs.remove(linkDirectory);
    } else if (!fs.existsSync(linkDirectory)) {
      console.log(`Linking dist to ${linkDirectory}.`);
      await fs.ensureDir('dist');
      await fs.ensureDir(path.resolve(linkDirectory, '..'));
      await fs.symlink(path.resolve('dist'), linkDirectory);
    } else {
      console.log(`Skipped linking to ${linkDirectory}, as it already exists.`);
    }
  }
}
