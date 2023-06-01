import { HttpResponse } from 'https://goru.me/x/http';
import { MIME_TYPES } from './constants.ts';

export const file = async (path: string): Promise<HttpResponse> => {
  path = path.replace(/\/\.\//g, '/');

  const base = path[0] === '/' ? '' : Deno.cwd();
  const file = await fetch(`file://${ base }/${ path }`).then(file => file.body).catch(() => null);
  const type = MIME_TYPES?.[ path.split('.').pop() ?? 'txt' ] ?? 'text/plain';

  if (!file) return { status: 404 };

  const stat = await Deno.stat(`${ base }/${ path }`);

  const mtime = stat.mtime !== null ? stat.mtime.toUTCString() : new Date().toUTCString();
  const size  = stat.size.toString();

  return {
    status: 200,
    body: file,
    headers: {
      'content-type': type,
      'last-modified': mtime,
      'content-length': size,
    },
  };
};
