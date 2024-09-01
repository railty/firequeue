"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("firebase-admin/firestore");
const uuid_1 = require("uuid");
const message_1 = require("../message");
class FirestoreMessage extends message_1.Message {
    constructor(payload) {
        super(Buffer.from(payload["body"], "base64"), payload["content-type"], payload["content-encoding"], payload["properties"], payload["headers"]);
        this.raw = payload;
    }
}
class FirestoreBroker {
    /**
     * Firestore broker class
     * @constructor FirestoreBroker
     * @param {string} url the connection string of Firestore
     * @param {object} opts the options object for Firestore connect of ioFirestore
     */
    constructor(url, opts) {
        this.channels = [];
        this.closing = false;
        this.opts = opts;
        this.collection = this.opts.collection;
        this.interval = this.opts.interval;
    }
    /**
     * codes from here: https://github.com/OptimalBits/bull/blob/129c6e108ce67ca343c8532161d06742d92b651c/lib/utils.js#L21-L44
     * @method FirestoreBroker#isReady
     * @returns {Promise} promises that continues if Firestore connected.
     */
    isReady() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
    /**
     * @method FirestoreBroker#disconnect
     * @returns {Promise} promises that continues if Firestore disconnected.
     */
    disconnect() {
        this.closing = true;
        return new Promise((resolve) => resolve());
    }
    /**
     * @method FirestoreBroker#publish
     *
     * @returns {Promise}
     */
    publish(body, exchange, routingKey, headers, properties) {
        const messageBody = JSON.stringify(body);
        const contentType = "application/json";
        const contentEncoding = "utf-8";
        const message = {
            body: Buffer.from(messageBody).toString("base64"),
            "content-type": contentType,
            "content-encoding": contentEncoding,
            headers,
            properties: Object.assign({ body_encoding: "base64", delivery_info: {
                    exchange: exchange,
                    routing_key: routingKey
                }, delivery_mode: 2, delivery_tag: (0, uuid_1.v4)() }, properties)
        };
        const doc = this.collection.doc(routingKey);
        return doc.update({
            value: firestore_1.FieldValue.arrayUnion(JSON.stringify(message))
        });
    }
    listTasks(routingKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const refDoc = this.collection.doc(routingKey);
            const doc = yield refDoc.get();
            const tasks = doc.data().value;
            return tasks;
        });
    }
    deleteTasks(routingKey, tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const refDoc = this.collection.doc(routingKey);
            return refDoc.update({
                value: firestore_1.FieldValue.arrayRemove(...tasks)
            });
        });
    }
    /**
     * @method FirestoreBroker#subscribe
     * @param {string} queue
     * @param {Function} callback
     * @returns {Promise}
     */
    subscribe(queue, callback) {
        const promiseCount = 1;
        return this.isReady().then(() => {
            for (let index = 0; index < promiseCount; index += 1) {
                this.channels.push(new Promise(resolve => this.receive(index, resolve, queue, callback)));
            }
            return Promise.all(this.channels);
        });
    }
    /**
     * @private
     * @param {number} index
     * @param {Fucntion} resolve
     * @param {string} queue
     * @param {Function} callback
     */
    receive(index, resolve, queue, callback) {
        process.nextTick(() => this.recieveOneOnNextTick(index, resolve, queue, callback));
    }
    /**
     * @private
     * @param {number} index
     * @param {Function} resolve
     * @param {String} queue
     * @param {Function} callback
     * @returns {Promise}
     */
    recieveOneOnNextTick(index, resolve, queue, callback) {
        if (this.closing) {
            resolve();
            return;
        }
        return this.receiveOne(queue)
            .then(body => {
            if (body) {
                callback(body);
            }
            Promise.resolve();
        })
            .then(() => this.receive(index, resolve, queue, callback))
            .catch(err => console.log(err));
    }
    /**
     * @private
     * @param {string} queue
     * @return {Promise}
     */
    receiveOne(queue) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("checking queue");
            const doc = this.collection.doc(queue);
            const results = yield doc.get();
            const tasks = results.data()['value'];
            if (tasks.length > 0) {
                const result = tasks.shift();
                doc.update({
                    value: firestore_1.FieldValue.arrayRemove(result)
                });
                const rawMsg = JSON.parse(result);
                // now supports only application/json of content-type
                if (rawMsg["content-type"] !== "application/json") {
                    throw new Error(`queue ${queue} item: unsupported content type ${rawMsg["content-type"]}`);
                }
                // now supports only base64 of body_encoding
                if (rawMsg.properties.body_encoding !== "base64") {
                    throw new Error(`queue ${queue} item: unsupported body encoding ${rawMsg.properties.body_encoding}`);
                }
                // now supports only utf-8 of content-encoding
                if (rawMsg["content-encoding"] !== "utf-8") {
                    throw new Error(`queue ${queue} item: unsupported content encoding ${rawMsg["content-encoding"]}`);
                }
                return new FirestoreMessage(rawMsg);
            }
            //return null;
            return new Promise((resolve) => {
                setTimeout(() => { resolve(null); }, this.interval);
            });
        });
    }
}
exports.default = FirestoreBroker;
