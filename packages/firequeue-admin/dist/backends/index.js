"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCeleryBackend = createCeleryBackend;
const url = require("url");
const redis_1 = require("./redis");
const firestore_1 = require("./firestore");
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
function getProtocol(uri) {
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
function createCeleryBackend(CELERY_BACKEND, CELERY_BACKEND_OPTIONS) {
    const brokerProtocol = getProtocol(CELERY_BACKEND);
    if (['redis', 'rediss'].indexOf(brokerProtocol) > -1) {
        return new redis_1.default(CELERY_BACKEND, CELERY_BACKEND_OPTIONS);
    }
    if (['firestore'].indexOf(brokerProtocol) > -1) {
        return new firestore_1.default(CELERY_BACKEND, CELERY_BACKEND_OPTIONS);
    }
    // do not reach here.
    throw new Error("unsupprted celery backend");
}
