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
const message_1 = require("../kombu/message");
class FirestoreMessage extends message_1.Message {
    constructor(payload) {
        super(Buffer.from(payload["body"], "base64"), payload["content-type"], payload["content-encoding"], payload["properties"], payload["headers"]);
        this.raw = payload;
    }
}
class singleTaskWorker {
    constructor(collection, interval, queue = "celery") {
        this.keyPrefix = "celery-task-meta-";
        this.handlers = {};
        this.collection = collection;
        this.interval = interval;
        this.queue = queue;
        this.closing = false;
    }
    register(name, handler) {
        if (!handler) {
            throw new Error("Undefined handler");
        }
        if (this.handlers[name]) {
            throw new Error("Handler is already set");
        }
        this.handlers[name] = function registHandler(...args) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield handler(...args);
                }
                catch (err) {
                    return err;
                }
            });
        };
    }
    storeResult(taskId, result, state) {
        return this.set(`${this.keyPrefix}${taskId}`, JSON.stringify({
            status: state,
            result: state == 'FAILURE' ? null : result,
            traceback: result,
            children: [],
            task_id: taskId,
            date_done: new Date().toISOString()
        }));
    }
    set(key, value) {
        return (this.collection.doc(key)).set({ value: value });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.info("celery.node worker starting...");
            console.info(`registered task: ${Object.keys(this.handlers)}`);
            this.closing = false;
            const timer = setInterval(() => {
                if (this.closing) {
                    if (timer)
                        clearInterval(timer);
                }
                try {
                    this.processTasks();
                }
                catch (err) {
                    console.error(err);
                }
            }, this.interval);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.closing = true;
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("disconnect");
            this.stop();
        });
    }
    processTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            const onMessage = this.createTaskHandler();
            try {
                const body = yield this.receiveOne(this.queue);
                if (body) {
                    return yield onMessage(body);
                }
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    receiveOne(queue) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("checking queue");
            const doc = this.collection.doc(queue);
            const results = yield doc.get();
            if (results.exists) {
                const tasks = results.data()['value'];
                if (tasks.length > 0) {
                    const result = tasks.shift();
                    yield doc.update({
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
            }
            return null;
        });
    }
    createTaskHandler() {
        const onTaskReceived = (message) => __awaiter(this, void 0, void 0, function* () {
            if (message) {
                let payload = null;
                let taskName = message.headers["task"];
                if (!taskName) {
                    // protocol v1
                    payload = message.decode();
                    taskName = payload["task"];
                }
                // strategy
                let body;
                let headers;
                if (payload == null && !("args" in message.decode())) {
                    body = message.decode(); // message.body;
                    headers = message.headers;
                }
                else {
                    const args = payload["args"] || [];
                    const kwargs = payload["kwargs"] || {};
                    const embed = {
                        callbacks: payload["callbacks"],
                        errbacks: payload["errbacks"],
                        chord: payload["chord"],
                        chain: null
                    };
                    body = [args, kwargs, embed];
                    headers = {
                        lang: payload["lang"],
                        task: payload["task"],
                        id: payload["id"],
                        rootId: payload["root_id"],
                        parentId: payload["parentId"],
                        group: payload["group"],
                        meth: payload["meth"],
                        shadow: payload["shadow"],
                        eta: payload["eta"],
                        expires: payload["expires"],
                        retries: payload["retries"] || 0,
                        timelimit: payload["timelimit"] || [null, null],
                        kwargsrepr: payload["kwargsrepr"],
                        origin: payload["origin"]
                    };
                }
                // request
                const [args, kwargs /*, embed */] = body;
                const taskId = headers["id"];
                const handler = this.handlers[taskName];
                if (!handler) {
                    throw new Error(`Missing process handler for task ${taskName}`);
                }
                console.info(`Received task: ${taskName}[${taskId}], args: ${args}, kwargs: ${JSON.stringify(kwargs)}`);
                let result;
                try {
                    const timeStart = process.hrtime();
                    result = yield handler(...args, kwargs);
                    const diff = process.hrtime(timeStart);
                    console.info(`Task ${taskName}[${taskId}] succeeded in ${diff[0] +
                        diff[1] / 1e9}s: ${result}`);
                    yield this.storeResult(taskId, result, "SUCCESS");
                }
                catch (err) {
                    console.info(`celery.node Task ${taskName}[${taskId}] failed: [${err}]`);
                    yield this.storeResult(taskId, err, "FAILURE");
                }
                ;
                return result;
            }
            ;
        });
        return onTaskReceived;
    }
}
exports.default = singleTaskWorker;
