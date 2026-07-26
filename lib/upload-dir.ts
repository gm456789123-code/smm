import { join } from 'path';

export function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  if (process.env.NODE_ENV === 'production') return '/home/u934475464/uploads';
  return join(process.cwd(), 'public', 'uploads');
}
