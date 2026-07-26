import { join } from 'path';
import { existsSync } from 'fs';

const PERSISTENT = '/home/u934475464/uploads';

export function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  if (existsSync(PERSISTENT)) return PERSISTENT;
  return join(process.cwd(), 'public', 'uploads');
}
