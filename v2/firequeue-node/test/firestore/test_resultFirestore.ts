import "mocha";
import { assert } from "chai";
import { AsyncResult } from "../../src/app/result";
import FirestoreBackend from "../../src/backends/firestore";
import * as sinon from "sinon";
import { getClient, getWorker, collection } from "../testlib";

console.log("file test_resultFirestore");

describe("AsyncResult", function(){
  this.timeout(30000);

  const firestoreBackend = new FirestoreBackend("firestore://", {collection: collection});

  let testName: string;
  beforeEach(function () {
    this.testName = this.currentTest?.title;
  });
  
  afterEach(() => {
    sinon.restore();
  })

  after(() => {
    firestoreBackend.disconnect();
  });

  describe("get", function() {
    this.timeout(10000);
    it("should return result when data stored in backend", function(done){
      // Arrange
      const testResult = "100";
      const testStatus = "SUCCESS";
      const asyncResult = new AsyncResult(this.testName, firestoreBackend);
      firestoreBackend.storeResult(this.testName, testResult, testStatus)
        .then(() => {
          // Action
          asyncResult.get()
            .then((result) => {

              // Assert
              assert.strictEqual(result, testResult);
              done();
            })
            .catch(error => {
              assert.fail(error.message);
              done();
            });
        });
    });

    it("should immediately resolve when the task was previously resolved", done => {
      // Arrange
      const testResult = "100";
      const testStatus = "SUCCESS";
      const asyncResult = new AsyncResult(testName, firestoreBackend);
      const getTaskMetaSpy = sinon.spy(firestoreBackend, "getTaskMeta");
      firestoreBackend.storeResult(testName, testResult, testStatus)
        .then(() => {
          // Action
          asyncResult.get()
            .then(() => {
              return asyncResult.get();
            })
            .catch(error => {
              assert.fail(error.message);
            })
            .then((result) => {
              // Assert
              assert.strictEqual(getTaskMetaSpy.callCount, 1);
              assert.strictEqual(result, testResult);
              done();
            })
            .catch(error => {
              assert.fail(error.message);
            });
        });
    });

    it("should throw when status is failure - firestore", done => {
      // Arrange
      const testResult = "100";
      const testStatus = "FAILURE";
      const result = new AsyncResult(testName, firestoreBackend);
      firestoreBackend.storeResult(testName, testResult, testStatus)
        .then(() => {

          // Action
          result.get()
            .then((result) => {
              assert.fail("should not get here");
            })
            .catch(error => {
              // Assert
              assert.strictEqual(error.message, "FAILURE");
              done();
            });
        });
    });

    it("should throw timeout when result is not in backend", done => {
      // Arrange
      const result = new AsyncResult(testName, firestoreBackend);
      
      // Action
      result
        .get(500)
        .then(() => {
          assert.fail("should not get here");
        })
        .catch(error => {
          // Assert
          assert.strictEqual(error.message, "TIMEOUT");
          done();
        });
    });
  });


  describe("result", () => {
    this.timeout(10000);
    it("should return result when data stored in backend", async () => {
      // Arrange
      const testResult = null;
      const testStatus = "FAILURE";
      const asyncResult = new AsyncResult(testName, firestoreBackend);
      await firestoreBackend.storeResult(testName, testResult, testStatus);
      
      // Action
      const result = await asyncResult.result();

      // Assert (If task is FAILURE, the result should be NULL and the TRACEBACK should have the error message.)
      assert.strictEqual(result, testResult);
    });

    it("should return null when result is not in backend", async () => {
      // Arrange
      const asyncResult = new AsyncResult(testName, firestoreBackend);

      // Action
      const result = await asyncResult.result();

      // Assert
      assert.strictEqual(result, null);
    });
  });

  describe("status", () => {
    this.timeout(10000);
    it("should return status when data stored in backend", async () => {
      // Arrange
      const testResult = "100";
      const testStatus = "FAILURE";
      const asyncResult = new AsyncResult(testName, firestoreBackend);
      await firestoreBackend.storeResult(testName, testResult, testStatus);

      // Action
      const status = await asyncResult.status();

      // Assert
      assert.strictEqual(status, testStatus);
    });

    it("should return when result is not in backend", async () => {
      // Arrange
      const asyncResult = new AsyncResult(testName, firestoreBackend);

      // Action
      const status = await asyncResult.status();

      // Assert
      //assert.strictEqual(status, null);
      assert.strictEqual(status, "FAILURE");
    });
  });

  describe("mixed with get and status", () => {
    this.timeout(10000);
    it("should resolve immediately when the task is previously resolved", done => {

      // Arrange
      const testResult = "100";
      const testStatus = "SUCCESS";
      const asyncResult = new AsyncResult(testName, firestoreBackend);
      const getTaskMetaSpy = sinon.spy(firestoreBackend, "getTaskMeta");
      firestoreBackend.storeResult(testName, testResult, testStatus)
        .then(() => {

          // Action
          asyncResult.get()
            .then(() => {
              // await the result a second time
              return Promise.all([asyncResult.result(), asyncResult.status()]);
            })
            .catch(error => {
              assert.fail(error.message);
            })
            .then((result) => {

              // Assert
              // the backend should not have been invoked more than once
              assert.strictEqual(getTaskMetaSpy.callCount, 1);
              assert.strictEqual(result[0], testResult);
              assert.strictEqual(result[1], testStatus);
              done();
            })
            .catch(error => {
              assert.fail(error.message);
            });
        });
    });
  });

});