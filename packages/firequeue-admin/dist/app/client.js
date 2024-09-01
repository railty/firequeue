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
const uuid_1 = require("uuid");
const base_1 = require("./base");
const task_1 = require("./task");
const result_1 = require("./result");
class TaskMessage {
    constructor(headers, properties, body, sentEvent) {
        this.headers = headers;
        this.properties = properties;
        this.body = body;
        this.sentEvent = sentEvent;
    }
}
class Client extends base_1.default {
    constructor() {
        super(...arguments);
        this.taskProtocols = {
            1: this.asTaskV1,
            2: this.asTaskV2
        };
    }
    get createTaskMessage() {
        return this.taskProtocols[this.conf.TASK_PROTOCOL];
    }
    sendTaskMessage(taskName, message) {
        const { headers, properties, body /*, sentEvent */ } = message;
        const exchange = "";
        // exchangeType = 'direct';
        // const serializer = 'json';
        this.isReady().then(() => this.broker.publish(body, exchange, this.conf.CELERY_QUEUE, headers, properties));
    }
    listResults() {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.backend.listResults();
            return results;
        });
    }
    deleteResults(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.backend.deleteResults(tasks);
            return results;
        });
    }
    listTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this.broker.listTasks(this.conf.CELERY_QUEUE);
            return tasks;
        });
    }
    deleteTasks(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.broker.deleteTasks(this.conf.CELERY_QUEUE, tasks);
        });
    }
    asTaskV2(taskId, taskName, args, kwargs) {
        const message = {
            headers: {
                lang: "js",
                task: taskName,
                id: taskId
                /*
                'shadow': shadow,
                'eta': eta,
                'expires': expires,
                'group': group_id,
                'retries': retries,
                'timelimit': [time_limit, soft_time_limit],
                'root_id': root_id,
                'parent_id': parent_id,
                'argsrepr': argsrepr,
                'kwargsrepr': kwargsrepr,
                'origin': origin or anon_nodename()
                */
            },
            properties: {
                correlationId: taskId,
                replyTo: ""
            },
            body: [args, kwargs, {}],
            sentEvent: null
        };
        return message;
    }
    /**
     * create json string representing celery task message. used by Client.publish
     *
     * celery protocol reference: https://docs.celeryproject.org/en/latest/internals/protocol.html
     * celery code: https://github.com/celery/celery/blob/4aefccf8a89bffe9dac9a72f2601db1fa8474f5d/celery/app/amqp.py#L307-L464
     *
     * @function createTaskMessage
     *
     * @returns {String} JSON serialized string of celery task message
     */
    asTaskV1(taskId, taskName, args, kwargs) {
        const message = {
            headers: {},
            properties: {
                correlationId: taskId,
                replyTo: ""
            },
            body: {
                task: taskName,
                id: taskId,
                args: args,
                kwargs: kwargs
            },
            sentEvent: null
        };
        return message;
    }
    /**
     * createTask
     * @method Client#createTask
     * @param {string} name for task name
     * @returns {Task} task object
     *
     * @example
     * client.createTask('task.add').delay([1, 2])
     */
    createTask(name) {
        return new task_1.default(this, name);
    }
    /**
     * get AsyncResult by task id
     * @param {string} taskId for task identification.
     * @returns {AsyncResult}
     */
    asyncResult(taskId) {
        return new result_1.AsyncResult(taskId, this.backend);
    }
    sendTask(taskName, args, kwargs, taskId) {
        taskId = taskId || (0, uuid_1.v4)();
        const message = this.createTaskMessage(taskId, taskName, args, kwargs);
        this.sendTaskMessage(taskName, message);
        const result = new result_1.AsyncResult(taskId, this.backend);
        return result;
    }
}
exports.default = Client;
