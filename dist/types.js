/**
 *  @typedef {Object} CLSProxy
 *  @property {string} [path]
 *  @property {string} host
 *  @property {string} [protocol]
 *  @property {string} [hostPath]
 */

/**
 *  @typedef {Object} CLSOptions
 *  @property {boolean} [ignoreUncaughtErrors]
 *  @property {CLSProxy | CLSProxy[]} [proxy]
 *  @property {boolean} [logResponse]
 *  @property {boolean} [defaultCors]
 *  @property {string} [responseBody]
 *  @property {string | string[]} [responseHeader]
 *  @property {number} [responseCode]
 *  @property {any} [router]
 *  @property {string} [dateFormat]
 *  @property {any} [defaultRoute]
 *  @property {number} [responseDelay]
 *  @property {any} [console]
 *  @property {import("express-serve-static-core").Express} [app]
 *  @property {any} [addRouter]
 *  @property {number | number[]} [port]
 *  @property {string | string[]} [hostname]
 *  @property {boolean} [silentStart]
 *  @property {string | number | Date} [mockDate]
 *  @property {string | number} [rawBodyLimit]
 *  @property {boolean} [indentResponse]
 *  @property {boolean} [color]
 *  @property {boolean} [sortFields]
 */

/**
 * A number, or a string containing a number.
 * @typedef {import("express-serve-static-core").Request<import("express-serve-static-core").RouteParameters<string>, any, any, qs.ParsedQs, Record<string, any>> &
 *   {
 *     locals: {
 *       id?: string,
 *       bodyType?: string,
 *       rawBodyBuffer?: any,
 *       rawBody?: import("es6-promise").Promise<any>,
 *       proxyUrl?: string,
 *       bodyError?: Error
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

/**
 * A number, or a string containing a number.
 * @typedef {import("http").Server &
 *   {
 *     promise: Promise<import("http").Server, Error & {server: import('http').Server}>,
 *   }
 * } ServerWithPromise
 */

/**
 * A number, or a string containing a number.
 * @typedef {ServerWithPromise[] &
 *   {
 *     promise: Promise<import("http").Server[]>,
 *   }
 * } ServersWithPromise
 */
"use strict";