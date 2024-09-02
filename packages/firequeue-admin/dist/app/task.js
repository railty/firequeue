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
class Task {
    /**
     * Asynchronous Task
     * @constructor Task
     * @param {Client} clinet celery client instance
     * @param {string} name celery task name
     */
    constructor(client, name) {
        this.client = client;
        this.name = name;
    }
    /**
     * @method Task#delay
     *
     * @returns {AsyncResult} the result of client.publish
     *
     * @example
     * client.createTask('task.add').delay(1, 2)
     */
    delay(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.applyAsync([...args]);
        });
    }
    applyAsync(args, kwargs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args && !Array.isArray(args)) {
                throw new Error("args is not array");
            }
            if (kwargs && typeof kwargs !== "object") {
                throw new Error("kwargs is not object");
            }
            return yield this.client.sendTask(this.name, args || [], kwargs || {});
        });
    }
}
exports.default = Task;
