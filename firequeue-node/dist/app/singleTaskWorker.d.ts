import { Message } from "../kombu/message";
export default class singleTaskWorker {
    collection: any;
    interval: any;
    queue: any;
    keyPrefix: string;
    handlers: object;
    closing: any;
    constructor(collection: any, interval: any, queue?: string);
    register(name: string, handler: Function): void;
    storeResult(taskId: string, result: any, state: string): any;
    private set;
    start(): Promise<void>;
    stop(): Promise<void>;
    disconnect(): Promise<void>;
    private processTasks;
    private receiveOne;
    createTaskHandler(): (message: Message) => Promise<any>;
}
