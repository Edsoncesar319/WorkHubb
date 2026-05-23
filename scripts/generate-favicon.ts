/**
 * Gera favicon e ícones do app a partir do logo WorkHubb.
 * Uso: npx tsx scripts/generate-favicon.ts [caminho-do-logo.png]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const defaultLogo = path.join(
  process.cwd(),
  'public',
  'logo-workhubb.png'
);

const logoPath = process.argv[2] ?? defaultLogo;

if (!fs.existsSync(logoPath)) {
  console.error(`Logo não encontrado: ${logoPath}`);
  process.exit(1);
}

const CROP_WIDTH = 400;
const HEIGHT = 512;

async function main() {
  const base = sharp(logoPath).extract({
    left: 0,
    top: 0,
    width: CROP_WIDTH,
    height: HEIGHT,
  });

  const blackBg = { r: 0, g: 0, b: 0, alpha: 1 as const };

  await base
    .clone()
    .resize(512, 512, { fit: 'contain', background: blackBg })
    .png()
    .toFile(path.join(process.cwd(), 'app', 'icon.png'));

  await base
    .clone()
    .resize(180, 180, { fit: 'contain', background: blackBg })
    .png()
    .toFile(path.join(process.cwd(), 'app', 'apple-icon.png'));

  await base
    .clone()
    .resize(16, 16, { fit: 'contain', background: blackBg })
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon-16.png'));

  console.log('Ícones gerados: app/icon.png, app/apple-icon.png, public/favicon-16.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
