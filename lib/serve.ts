import { Handler } from 'https://goru.me/x/http';
import { file } from './file.ts';

interface StaticOptions {
  paths?: {
    [ route: string ]: string,
  },

  'access-control-allow-origin'?: string,
  'cache-control'?: string,
}

export const serve = (route: string, root: string, options: StaticOptions = {}): Handler => {
  route = route.replace(/\*?$/, '*');
  root = root.replace(/(^\.\/)?/, './');

  options['access-control-allow-origin'] ??= '*';
  options['cache-control'] ??= 'max-age=0';

  return async ({ href, respond }) => {
    const pathname = new URL(href).pathname;

    const pattern = new URLPattern({ pathname: route });
    if (!pattern.test(href)) return;
    
    const base = route.split('/').filter((item) => item != '*' && item != '');
    const rest = pathname.replace(/^\//, '').split('/').filter((_, index) => index >= base.length);
    const path = `${ root.replace(/\/$/, '') }/${ [ ...rest ].join('/') }`;

    if (path[0] !== '.') respond({ status: 403 });

    const response = await file(path);

    if (response.status === 404) return respond(response);

    const etag = btoa(encodeURIComponent(`${ rest.join('/') }-${ (response.headers as Record<string, string>)['last-modified'] ?? '0' }`));

    const headers = { ...response.headers } as Record<string, string>;

    headers['etag'] = etag;
    headers['access-control-allow-origin'] = options['access-control-allow-origin'] ?? '*';
    headers['cache-control'] = options.paths?.[ path.replace(/^\./, '') ] ?? options['cache-control'] ?? 'max-age=0';

    response.headers = { ...headers };

    respond(response);
  };
};