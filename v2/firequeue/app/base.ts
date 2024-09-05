import { CeleryConf, defaultConf } from "./conf";
import { CeleryBroker } from "../brokers";
import { CeleryBackend } from "../backends";
import FirestoreBackend from "./firestoreBackend";
import FirestoreBroker from "./firestoreBroker";

export default class Base {
  private _backend;
  private _broker;
  conf;

  /**
   * Parent Class of Client and Worker
   * for creates an instance of celery broker and celery backend
   *
   * @constructor Base
   */
  constructor(collection, queue = "celery", keyPrefix = "celery-task-meta-") {
    this.conf = defaultConf();
    this.conf.collection = collection;
    this.conf.CELERY_QUEUE = queue;
    this.conf.CELERY_RESULT_KEYPPREFIX = keyPrefix;
  }

  get broker(): CeleryBroker {
    if (!this._broker) {
      this._broker = new FirestoreBroker(this.conf.collection, this.conf.CELERY_QUEUE);
    }
    return this._broker;
  }

  get backend(): CeleryBackend {
    if (!this._backend) {
      this._backend = new FirestoreBackend(this.conf.collection, this.conf.CELERY_RESULT_KEYPPREFIX);
    }

    return this._backend;
  }
}
