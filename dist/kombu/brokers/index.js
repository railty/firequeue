"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCeleryBroker = newCeleryBroker;
const url = require("url");
const redis_1 = require("./redis");
const firestore_1 = require("./firestore");
/**
 * Support broker protocols of celery.node.
 * @private
 * @constant
 */
const supportedProtocols = ["redis", "rediss", "amqp", "amqps", "firestore"];
/**
 * takes url string and after parsing scheme of url, returns protocol.
 *
 * @private
 * @param {String} uri
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
 * @param {String} CELERY_BROKER
 * @param {object} CELERY_BROKER_OPTIONS
 * @param {string} CELERY_QUEUE
 * @returns {CeleryBroker}
 */
function newCeleryBroker(CELERY_BROKER, CELERY_BROKER_OPTIONS, CELERY_QUEUE = "celery") {
    const brokerProtocol = getProtocol(CELERY_BROKER);
    if (['redis', 'rediss'].indexOf(brokerProtocol) > -1) {
        return new redis_1.default(CELERY_BROKER, CELERY_BROKER_OPTIONS);
    }
    if (['firestore'].indexOf(brokerProtocol) > -1) {
        return new firestore_1.default(CELERY_BROKER, CELERY_BROKER_OPTIONS);
    }
    // do not reach here.
    throw new Error("unsupprted celery broker");
}
