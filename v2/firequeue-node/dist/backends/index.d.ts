export interface CeleryBackend {
    isReady: () => Promise<any>;
    disconnect: () => Promise<any>;
    storeResult: (taskId: string, result: any, state: string) => Promise<any>;
    getTaskMeta: (taskId: string) => Promise<object>;
    listResults: () => Promise<object>;
    deleteResults: (results: Array<string>) => Promise<void>;
}
/**
 *
 * @param {string} CELERY_BACKEND
 * @param {object} CELERY_BACKEND_OPTIONS
 * @returns {CeleryBackend}
 */
export declare function createCeleryBackend(CELERY_BACKEND: string, CELERY_BACKEND_OPTIONS: object): CeleryBackend;
