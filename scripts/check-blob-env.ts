#!/usr/bin/env tsx
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getBlobConfigStatus } from '../lib/blob';

const envFiles = ['.env.development.local', '.env.local', '.env'];

for (const file of envFiles) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) continue;

  console.log(`📄 ${file}`);
  for (const line of readFileSync(path, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  break;
}

const status = getBlobConfigStatus();

if (status.ok) {
  console.log('\n✅ BLOB_READ_WRITE_TOKEN configurado');
  if (status.storeId) console.log(`   BLOB_STORE_ID: ${status.storeId}`);
  process.exit(0);
}

console.log('\n❌ BLOB_READ_WRITE_TOKEN ausente\n');
console.log(status.hint ?? '');
console.log('\nGuia completo: VERCEL_BLOB_SETUP.md\n');
process.exit(1);
