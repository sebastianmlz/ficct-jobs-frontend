import { constants } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');
const environmentsDir = path.join(projectRoot, 'src', 'environments');
const templatePath = path.join(environmentsDir, 'environment.example.ts');

const targets = [
  { filename: 'environment.ts', production: true },
  { filename: 'environment.development.ts', production: false },
];

function normalizeTemplate(template, production) {
  return template.replace(
    /production:\s*(true|false)/,
    `production: ${String(production)}`,
  );
}

function escapeSingleQuotedValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function applyEnvOverrides(template) {
  const overrides = [
    { envName: 'API_BASE_URL', property: 'apiBaseUrl' },
    { envName: 'CV_BUILDER_URL', property: 'cvBuilderUrl' },
  ];

  let output = template;

  for (const { envName, property } of overrides) {
    const value = process.env[envName]?.trim();
    if (!value) {
      continue;
    }

    const propertyPattern = new RegExp(`(${property}\\s*:\\s*)['"][^'"]*['"]`);
    output = output.replace(
      propertyPattern,
      `$1'${escapeSingleQuotedValue(value)}'`,
    );
  }

  return output;
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureEnvironments() {
  await mkdir(environmentsDir, { recursive: true });

  const templateExists = await exists(templatePath);
  if (!templateExists) {
    throw new Error(`Missing template file: ${templatePath}`);
  }

  const template = await readFile(templatePath, 'utf-8');

  for (const target of targets) {
    const targetPath = path.join(environmentsDir, target.filename);
    const fileExists = await exists(targetPath);

    // Start from the existing file (preserving local apiBaseUrl/cvBuilderUrl
    // values for local dev) or from the template when the file is missing.
    const base = fileExists
      ? await readFile(targetPath, 'utf-8')
      : template;

    // Always enforce the target's `production` flag, even on a pre-existing
    // file. environment.ts must be production:true and environment.development.ts
    // production:false; a stale generated file must never leak the wrong flag
    // into the build (which would ship the prod bundle in Angular dev mode).
    const normalized = normalizeTemplate(base, target.production);

    // Apply API_BASE_URL / CV_BUILDER_URL overrides when those env vars are
    // set. This is what makes the Dockerfile build args actually take effect:
    // the build arg rewrites the apiBaseUrl/cvBuilderUrl in place. With no env
    // vars set, the file's existing URLs are preserved unchanged.
    const withOverrides = applyEnvOverrides(normalized);

    if (!fileExists || withOverrides !== base) {
      await writeFile(targetPath, withOverrides, 'utf-8');
      console.log(
        `${fileExists ? 'Updated' : 'Created'} ${path.relative(projectRoot, targetPath)}`,
      );
    }
  }
}

ensureEnvironments().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
