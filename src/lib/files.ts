import { useEffect, useState } from 'react';
import { TODAY, type AgreementFile } from './types';

/*
 * Uploaded agreement files. localStorage is too small for documents, so the
 * bytes go to IndexedDB and app state keeps only the metadata. Like the rest
 * of the prototype, files stay in the visitor's own browser.
 */

const DB_NAME = 'countinvoice_files_v1';
const STORE = 'files';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPT = '.pdf,.doc,.docx';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putFile(blob: Blob): Promise<string> {
  const id = `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await run('readwrite', (s) => s.put(blob, id));
  return id;
}

export function getFile(id: string): Promise<Blob | undefined> {
  return run<Blob | undefined>('readonly', (s) => s.get(id));
}

export function deleteFile(id: string): Promise<void> {
  return run('readwrite', (s) => s.delete(id)).then(() => undefined);
}

export function clearFiles(): Promise<void> {
  return run('readwrite', (s) => s.clear()).then(() => undefined);
}

/** Returns an error message, or null when the file is acceptable. */
export function validateFile(file: File): string | null {
  if (!/\.(pdf|docx?)$/i.test(file.name)) return 'Use a PDF, DOC or DOCX file.';
  if (file.size > MAX_FILE_BYTES) return 'That file is over 10 MB. Try a smaller one.';
  return null;
}

/** Stores the file and returns its metadata for app state. */
export async function storeUpload(
  file: File,
  providedBy: AgreementFile['providedBy'],
  uploadedAt: string,
): Promise<AgreementFile> {
  const id = await putFile(file);
  return {
    id,
    name: file.name,
    size: file.size,
    mime: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''),
    uploadedAt,
    providedBy,
  };
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isPdf(file: Pick<AgreementFile, 'mime' | 'name'>): boolean {
  return file.mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * A URL for viewing or downloading the file: the static `url` for sample data,
 * otherwise an object URL for the stored blob. `missing` means the file isn't
 * in this browser (e.g. a share link opened on another device).
 */
export function useFileUrl(file?: AgreementFile): { url: string | null; missing: boolean } {
  const [blobState, setBlobState] = useState<{ id: string; url: string | null; missing: boolean }>({
    id: '',
    url: null,
    missing: false,
  });
  const id = file?.url ? '' : (file?.id ?? '');

  useEffect(() => {
    if (!id) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    getFile(id)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) return setBlobState({ id, url: null, missing: true });
        objectUrl = URL.createObjectURL(blob);
        setBlobState({ id, url: objectUrl, missing: false });
      })
      .catch(() => !cancelled && setBlobState({ id, url: null, missing: true }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (!file) return { url: null, missing: false };
  if (file.url) return { url: file.url, missing: false };
  return blobState.id === id
    ? { url: blobState.url, missing: blobState.missing }
    : { url: null, missing: false };
}

export interface UploadChoice {
  providedBy: AgreementFile['providedBy'];
  signed?: { date: string; signatureName?: string };
}

/** Reads the "who provided it" and "already signed" fields from a form. */
export function readUploadChoice(f: FormData): UploadChoice {
  const providedBy = f.get('providedBy') === 'client' ? 'client' : 'freelancer';
  if (f.get('alreadySigned') !== 'yes') return { providedBy };
  return {
    providedBy,
    signed: {
      date: String(f.get('signedOn') || TODAY),
      signatureName: String(f.get('signedBy') || '').trim() || undefined,
    },
  };
}
