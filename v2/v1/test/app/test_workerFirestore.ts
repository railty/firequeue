import { assert } from "chai";
import Redis from "ioredis";
import Client from "../../src/app/client";
import Worker from "../../src/app/worker";
import { CeleryConf } from "../../src/app/conf";
import serviceAccount from "../firequeue.sa";

describe("node celery worker with firestore broker", function(){
  this.timeout(30000);

  const worker = new Worker('firestore://', 'firestore://');
  (worker.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
  (worker.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;

  before(() => {
    worker.register("tasks.add", (a, b) => a + b);
    worker.register("tasks.add_kwargs", ({ a, b }) => a + b);
    worker.register("tasks.add_mixed", (a, b, { c, d }) => a + b + c + d);
    worker.start();
  });

  afterEach(() => {
    return worker.whenCurrentJobsFinished();
  });

  after(() => {
    worker.disconnect();
  });

  describe("worker running", function(){
    this.timeout(10000);
    it("tasks.add", done => {

      const client = new Client('firestore://', 'firestore://');
      (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
      (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
      
      const result = client.sendTask("tasks.add", [1, 2]);
      result.get().then(data => {
        assert.equal(data, 3);
        client.disconnect().then(() => {
          done();
        });
      });
    });
    it("tasks.add_kwargs", done => {
      const client = new Client('firestore://', 'firestore://');
      (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
      (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
      const result = client.sendTask("tasks.add_kwargs", [], { a: 1, b: 2 });

      result.get().then(data => {
        assert.equal(data, 3);

        client.disconnect().then(() => done());
      });
    });

    it("tasks.add_mixed", done => {
      const client = new Client('firestore://', 'firestore://');
      (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
      (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
      const result = client.sendTask("tasks.add_mixed", [3, 4], { c: 1, d: 2 });

      result.get().then(data => {
        assert.equal(data, 10);

        client.disconnect().then(() => done());
      });
    });
  });
});

describe("node celery worker with firestore broker", function(){
  this.timeout(20000);
  const worker = new Worker('firestore://', 'firestore://');
  (worker.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
  (worker.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;

  before(() => {
    worker.register("tasks.add", (a, b) => a + b);
    worker.register("tasks.add_kwargs", ({ a, b }) => a + b);
    worker.register("tasks.add_mixed", (a, b, { c, d }) => a + b + c + d);
    worker.start();
  });

  afterEach(() => {
    return worker.whenCurrentJobsFinished();
  });

  after(() => {
    worker.disconnect();
  });

  describe("worker running with firestore broker", () => {
    this.timeout(10000);
    it("tasks.add amqp", done => {
      const client = new Client('firestore://', 'firestore://');
      (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
      (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
      const result = client.sendTask("tasks.add", [1, 2]);

      result.get().then(data => {
        assert.equal(data, 3);

        client.disconnect().then(() => done());
      });
    });

    it("tasks.add_kwargs amqp", done => {
      const client = new Client('firestore://', 'firestore://');
      (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
      (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
      const result = client.sendTask("tasks.add_kwargs", [], { a: 1, b: 2 });

      result.get().then(data => {
        assert.equal(data, 3);

        client.disconnect().then(() => done());
      });
    });

    it("tasks.add_mixed amqp", done => {
      const client = new Client('firestore://', 'firestore://');
      (client.conf.CELERY_BACKEND_OPTIONS as any).sa = serviceAccount;
      (client.conf.CELERY_BROKER_OPTIONS as any).sa = serviceAccount;
      const result = client.sendTask("tasks.add_mixed", [3, 4], { c: 1, d: 2 });

      result.get().then(data => {
        assert.equal(data, 10);

        client.disconnect().then(() => done());
      });
    });
  });

});
