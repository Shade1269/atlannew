import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecaptchaManagerRuntime as createRecaptchaManager } from '../src/features/auth/utils/recaptchaManagerRuntime.js';

const createInstanceFactory = (clearLog) => async () => {
  return {
    clear: () => {
      clearLog.push('cleared');
    },
  };
};

test('cleanup clears the current reCAPTCHA instance', async () => {
  const clearLog = [];
  const manager = createRecaptchaManager({
    createInstance: createInstanceFactory(clearLog),
  });

  await manager.initialize();
  manager.cleanup();

  assert.deepEqual(clearLog, ['cleared']);
  assert.equal(manager.getCurrent(), null);
});

test('force reset clears existing instance and resets container', async () => {
  const clearLog = [];
  let resetCount = 0;
  const manager = createRecaptchaManager({
    createInstance: createInstanceFactory(clearLog),
    resetContainer: async () => {
      resetCount += 1;
    },
  });

  const first = await manager.initialize();
  const second = await manager.initialize(true);

  assert.notStrictEqual(first, second);
  assert.equal(clearLog.length, 1);
  assert.equal(resetCount, 1);
});
