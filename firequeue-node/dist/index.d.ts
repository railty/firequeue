import Client from "./app/client";
import Worker from "./app/worker";
import STWorker from "./app/singleTaskWorker";
export declare function createClient(collection: any, queue?: string): Client;
export declare function createWorker(collection: any, interval?: number, queue?: string): Worker;
export declare function createSTWorker(collection: any, interval?: number, queue?: string): STWorker;
