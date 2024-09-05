import * as url from "url";
import RedisBackend from "./redis";
import FirestoreBackend from "./firestore";

export interface CeleryBackend {
  isReady: () => Promise<any>;
  disconnect: () => Promise<any>;
  storeResult: (taskId: string, result: any, state: string) => Promise<any>;
  getTaskMeta: (taskId: string) => Promise<object>;
  listResults: () => Promise<object>;
  deleteResults: (results: Array<string>) => Promise<void>;
}

/**
 * Support backend protocols of celery.node.
 * @private
 * @constant
 */
const supportedProtocols = ["redis", "rediss", "amqp", "amqps", "firestore"];

/**
 * takes url string and after parsing scheme of url, returns protocol.
 *
 * @private
 * @param {string} uri
 * @returns {String} protocol string.
 * @throws {Error} when url has unsupported protocols
 */
function getProtocol(uri: string): string {
  const protocol = url.parse(uri).protocol.slice(0, -1);
  if (supportedProtocols.indexOf(protocol) === -1) {
    throw new Error(`Unsupported type: ${protocol}`);
  }
  return protocol;
}

/**
 *
 * @param {string} CELERY_BACKEND
 * @param {object} CELERY_BACKEND_OPTIONS
 * @returns {CeleryBackend}
 */
export function createCeleryBackend(
  CELERY_BACKEND: string,
  CELERY_BACKEND_OPTIONS: object
): CeleryBackend {
  const brokerProtocol = getProtocol(CELERY_BACKEND);
  if (['redis', 'rediss'].indexOf(brokerProtocol) > -1) {
    return new RedisBackend(CELERY_BACKEND, CELERY_BACKEND_OPTIONS);
  }

  if (['firestore'].indexOf(brokerProtocol) > -1) {
    return new FirestoreBackend(CELERY_BACKEND, CELERY_BACKEND_OPTIONS);
  }

  // do not reach here.
  throw new Error("unsupprted celery backend");
}
