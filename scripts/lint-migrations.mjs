#!/usr/bin/env node
// scripts/lint-migrations.mjs
// ---------------------------------------------------------------------------
// Pre-deploy safety check for Supabase SQL migrations.
//
// Checks:
//   1. No duplicate numeric prefixes (e.g. two "007_" files)
//   2. Every CREATE OR REPLACE FUNCTION is preceded by a matching
//      DROP FUNCTION IF EXISTS (prevents stale overloads when params change)
//   3. Filenames follow the expected pattern
//
// Usage:
//   node scripts/lint-migrations.mjs          # lint all
//   npm run db:lint                            # via package.json
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

let errors = 0;
let warnings = 0;

function error(file, msg) {
  console.error(`  ERROR  ${file}: ${msg}`);
  errors++;
}

function warn(file, msg) {
  console.warn(`  WARN   ${file}: ${msg}`);
  warnings++;
}

// ─── 1. Collect files ────────────────────────────────────────────────────────

let files;
try {
  files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
} catch {
  console.error(`Could not read ${MIGRATIONS_DIR}`);
  process.exit(1);
}

console.log(`\nLinting ${files.length} migration(s) in ${MIGRATIONS_DIR}\n`);

// ─── 2. Check for duplicate numeric prefixes ────────────────────────────────

const prefixMap = new Map(); // prefix → [filenames]
const PREFIX_RE = /^(\d+[a-z]?)_/;

for (const file of files) {
  const match = file.match(PREFIX_RE);
  if (!match) {
    warn(file, "Filename does not start with a numeric prefix (e.g. 001_)");
    continue;
  }
  const prefix = match[1];
  if (!prefixMap.has(prefix)) {
    prefixMap.set(prefix, []);
  }
  prefixMap.get(prefix).push(file);
}

for (const [prefix, names] of prefixMap.entries()) {
  if (names.length > 1) {
    error(
      names.join(", "),
      `Duplicate migration prefix "${prefix}_" — migrations must have unique numeric prefixes`
    );
  }
}

// ─── 3. Check for missing DROP before CREATE OR REPLACE FUNCTION ────────────

const CREATE_FN_RE =
  /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(\w+)\s*\(/gi;

const DROP_FN_RE =
  /DROP\s+FUNCTION\s+IF\s+EXISTS\s+(\w+)\s*\(/gi;

for (const file of files) {
  const filePath = join(MIGRATIONS_DIR, file);
  const sql = readFileSync(filePath, "utf-8");

  // Collect all functions DROPped in this file
  const droppedFunctions = new Set();
  let m;
  while ((m = DROP_FN_RE.exec(sql)) !== null) {
    droppedFunctions.add(m[1].toLowerCase());
  }

  // Check each CREATE OR REPLACE FUNCTION has a preceding DROP
  while ((m = CREATE_FN_RE.exec(sql)) !== null) {
    const fnName = m[1].toLowerCase();

    // Skip trigger functions (no params → no overload risk)
    if (fnName.startsWith("update_") && fnName.endsWith("_updated_at")) {
      continue;
    }

    if (!droppedFunctions.has(fnName)) {
      warn(
        file,
        `CREATE OR REPLACE FUNCTION ${m[1]}() has no matching DROP FUNCTION IF EXISTS — ` +
          `if parameters change in a future migration, a stale overload will remain`
      );
    }
  }
}

// ─── 4. Summary ─────────────────────────────────────────────────────────────

console.log("");
if (errors > 0) {
  console.error(`\n  ${errors} error(s), ${warnings} warning(s)\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n  0 errors, ${warnings} warning(s)\n`);
  process.exit(0);
} else {
  console.log("  All checks passed!\n");
  process.exit(0);
}
