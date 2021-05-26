/**
 *  @typedef {Object} CLSOptions
 *  @property {boolean} [ignoreUncaughtErrors]
 *  @property {{
 *    path: string;
 *    host: string;
 *    protocol: string;
 *    hostPath: string;
 *  }[]} [proxy]
 *  @property {boolean} [logResponse]
 *  @property {boolean} [defaultCors]
 *  @property {string} [responseBody]
 *  @property {string[]} [responseHeader]
 *  @property {number} [responseCode]
 *  @property {any} [router]
 *  @property {string} [dateFormat]
 *  @property {any} [defaultRoute]
 *  @property {any} [console]
 *  @property {import("express-serve-static-core").Express} [app]
 *  @property {any} [addRouter]
 *  @property {number} [port]
 *  @property {string} [hostname]
 */

/**
 * A number, or a string containing a number.
 * @typedef {import("express-serve-static-core").Request<import("express-serve-static-core").RouteParameters<string>, any, any, qs.ParsedQs, Record<string, any>> &
 *   {
 *     locals: {
 *       id?: string,
 *       bodyType?: string,
 *       rawBody?: string,
 *       proxyUrl?: string
 *     }
 *   }
 * } RequestExt
 */

/**
 * A number, or a string containing a number.
 * @typedef {import("express-serve-static-core").Response<any, Record<string, any>, number> &
 *   {
 *     _header?: Object,
 *   }
 * } ResponseExt
 */
