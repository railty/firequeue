"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.createWorker = createWorker;
const client_1 = require("./app/client");
const worker_1 = require("./app/worker");
function createClient(collection, queue = "celery") {
    const client = new client_1.default("firestore://", "firestore://", queue);
    client.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
    client.conf.CELERY_BROKER_OPTIONS["collection"] = collection;
    return client;
}
function createWorker(collection, interval = 5000, queue = "celery") {
    const worker = new worker_1.default('firestore://', 'firestore://', queue);
    worker.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
    worker.conf.CELERY_BROKER_OPTIONS = {
        collection: collection,
        interval: interval
    };
    return worker;
}
