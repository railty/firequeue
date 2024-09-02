import Client from "./app/client";
import Worker from "./app/worker";
export declare function createClient(collection: any, queue?: string): Client;
export declare function createWorker(collection: any, interval?: number, queue?: string): Worker;
