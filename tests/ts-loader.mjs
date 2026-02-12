import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const loaderDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(loaderDir, '..');
const srcDir = path.join(projectRoot, 'src');
const simpleSceneStubUrl = pathToFileURL(
  path.join(projectRoot, 'tests/mocks/simple-scene-stub.js'),
).href;

const candidateSuffixes = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

async function fileExists(candidate) {
  try {
    const stats = await stat(candidate);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function tryResolveFile(basePath) {
  const tested = new Set();
  const candidates = [];

  for (const suffix of candidateSuffixes) {
    candidates.push(suffix ? `${basePath}${suffix}` : basePath);
  }
  for (const suffix of candidateSuffixes) {
    candidates.push(path.join(basePath, `index${suffix}`));
  }

  for (const rawCandidate of candidates) {
    const candidate = path.normalize(rawCandidate);
    if (tested.has(candidate)) continue;
    tested.add(candidate);

    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveMock(specifier) {
  const isTestEnv = (process.env.NODE_ENV ?? 'test') === 'test';
  if (isTestEnv && specifier === '@/three/SimpleScene') {
    return simpleSceneStubUrl;
  }
  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  const mockUrl = resolveMock(specifier);
  if (mockUrl) {
    return { url: mockUrl, shortCircuit: true };
  }

  if (specifier.startsWith('@/')) {
    const target = path.resolve(srcDir, specifier.slice(2));
    const resolvedPath = await tryResolveFile(target);
    if (resolvedPath) {
      return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
    }
  }

  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const parentDir = context.parentURL
        ? path.dirname(fileURLToPath(context.parentURL))
        : projectRoot;
      const target = path.resolve(parentDir, specifier);
      const resolvedPath = await tryResolveFile(target);
      if (resolvedPath) {
        return { url: pathToFileURL(resolvedPath).href, shortCircuit: true };
      }
    }
    throw error;
  }
}

const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2020,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  sourceMap: false,
};

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    const filename = fileURLToPath(url);
    const source = await readFile(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions,
      fileName: filename,
      reportDiagnostics: false,
    });

    return {
      format: 'module',
      source: outputText,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
