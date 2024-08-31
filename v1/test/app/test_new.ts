import { assert } from "chai";
import Redis from "ioredis";
import * as sinon from "sinon";
import Client from "../../src/app/client";
import Worker from "../../src/app/worker";
import { AsyncResult } from "../../src/app/result";
import { CeleryConf } from "../../src/app/conf";
import serviceAccount from "../firequeue.sa";

describe("celery functional tests", function() {
  const client = new Client("firestore://", "firestore://");
  (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
  (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
  const worker = new Worker("firestore://", "firestore://");
  (worker.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
  (worker.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;

  before(() => {
    worker.register("tasks.add", (a, b) => a + b);
    worker.register(
      "tasks.delayed",
      (result, delay) =>
        new Promise(resolve => {
          setTimeout(() => resolve(result), delay);
        })
    );
    //worker.start();
  });

  afterEach(() => {
    sinon.restore();
    return worker.whenCurrentJobsFinished();
  });

  after(() => {
    Promise.all([client.disconnect(), worker.disconnect()]);
  });

  describe("initialization", () => {
    it("should create a valid redis client without error", done => {
      client.isReady().then(() => done());
    });
  });


});
