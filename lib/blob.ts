import { put, type PutBlobResult } from '@vercel/blob';

export type BlobConfigStatus = {
  ok: boolean;
  token?: string;
  storeId?: string;
  hint?: string;
};

export function getBlobConfigStatus(): BlobConfigStatus {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();

  if (token) {
    return { ok: true, token, storeId };
  }

  return {
    ok: false,
    hint:
      'Crie um Blob Store na Vercel (Storage → Blob → Connect to Project), depois rode: vercel env pull .env.development.local e reinicie npm run dev.',
  };
}

export const BLOB_NOT_CONFIGURED_MESSAGE =
  'Upload indisponível: configure o Vercel Blob (BLOB_READ_WRITE_TOKEN). Veja VERCEL_BLOB_SETUP.md';

export async function uploadToVercelBlob(
  pathname: string,
  body: Parameters<typeof put>[1],
  options?: Omit<Parameters<typeof put>[2], 'token'>
): Promise<PutBlobResult> {
  const status = getBlobConfigStatus();
  if (!status.ok || !status.token) {
    throw new Error(BLOB_NOT_CONFIGURED_MESSAGE);
  }

  return put(pathname, body, {
    ...options,
    token: status.token,
  });
}
