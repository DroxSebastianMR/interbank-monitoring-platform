const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { importer, Parser } = require('@dbml/core');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'docs', 'database-diagrams');
const sources = [
  { name: 'interbank-app', directory: 'interbank-app-backend', schema: 'app' },
  { name: 'monitoring', directory: 'monitoring-backend', schema: 'monitoring' },
];

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function exportSchema(source) {
  const prisma = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    [
      'exec', 'prisma', 'migrate', 'diff', '--from-empty',
      '--to-schema-datamodel', 'prisma/schema.prisma', '--script',
    ],
    {
      cwd: path.join(root, source.directory),
      encoding: 'utf8',
      shell: process.platform === 'win32',
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  if (prisma.error || prisma.status !== 0) {
    throw new Error(`Prisma export failed for ${source.name} (exit ${prisma.status})`);
  }

  const sql = prisma.stdout;
  if (!sql.includes(`CREATE SCHEMA IF NOT EXISTS "${source.schema}";`)) {
    throw new Error(`The ${source.schema} schema was not found in ${source.name}`);
  }
  const rawDbml = importer.import(sql, 'postgres');
  // The SQL importer duplicates qualified enum schemas ("app"."app".Currency).
  const duplicatePrefix = `"${source.schema}"."${source.schema}".`;
  const malformedEnumArray = new RegExp(
    `"${source.schema}"\\.""${source.schema}"\\.([A-Za-z][A-Za-z0-9_]*)\\[\\]"`,
    'g',
  );
  const dbml = rawDbml
    .replaceAll(duplicatePrefix, `${source.schema}.`)
    .replace(malformedEnumArray, `${source.schema}.$1[]`);
  if (dbml.includes(duplicatePrefix)) throw new Error(`Unnormalized enum in ${source.name}`);

  new Parser().parse(dbml, 'dbmlv2');
  const sqlTables = count(sql, /^CREATE TABLE /gm);
  const sqlReferences = count(sql, / FOREIGN KEY \(/g);
  const dbmlTables = count(dbml, /^Table /gm);
  const dbmlReferences = count(dbml, /^Ref /gm);
  if (sqlTables !== dbmlTables || sqlReferences !== dbmlReferences) {
    throw new Error(`Incomplete conversion for ${source.name}: ${sqlTables}/${dbmlTables} tables, ${sqlReferences}/${dbmlReferences} references`);
  }

  fs.writeFileSync(
    path.join(output, `${source.name}.postgresql.sql`),
    `-- Diagram export from ${source.directory}/prisma/schema.prisma. Do not apply to a live database.\n${sql}`,
  );
  fs.writeFileSync(path.join(output, `${source.name}.dbml`), `// ${source.name}: ${source.schema} schema\n${dbml}`);
  process.stdout.write(`${source.name}: ${sqlTables} tables, ${sqlReferences} references\n`);
  return dbml;
}

try {
  fs.mkdirSync(output, { recursive: true });
  const [appDbml, monitorDbml] = sources.map(exportSchema);
  const combined = [
    'Project InterbankMonitoring {',
    "  database_type: 'PostgreSQL'",
    "  Note: 'Diagrama conceptual. app y monitoring pertenecen a proyectos Supabase independientes.'",
    '}',
    '',
    appDbml,
    monitorDbml,
  ].join('\n');
  new Parser().parse(combined, 'dbmlv2');
  fs.writeFileSync(path.join(output, 'combined.dbml'), combined);
  process.stdout.write('Combined diagram validated. No database connection was used.\n');
} catch (error) {
  const detail = error instanceof Error ? error.message : JSON.stringify(error);
  process.stderr.write(`Schema export failed: ${String(detail).slice(0, 1000)}\n`);
  process.exitCode = 1;
}
