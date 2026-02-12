import test from 'node:test';
import assert from 'node:assert/strict';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

test('inbox store updates unread count when marking as read', async () => {
  const { createInboxStore } = await import('@/hooks/useInbox');

  const store = createInboxStore('test-suite', { disablePersistence: true });
  const initial = store.getSnapshot();

  assert.ok(initial.notifications.length > 0, 'expected seeded notifications');
  assert.equal(
    initial.notifications.filter((item) => !item.read).length,
    initial.unreadCount,
    'unread count should match unread items'
  );

  const target = initial.notifications.find((item) => !item.read);
  assert.ok(target, 'expected at least one unread notification');
  store.markAsRead(target.id);

  const afterMark = store.getSnapshot();
  const updated = afterMark.notifications.find((item) => item.id === target.id);
  assert.ok(updated?.read, 'notification should be marked read');
  assert.equal(
    afterMark.notifications.filter((item) => !item.read).length,
    afterMark.unreadCount,
    'unread count updates after marking'
  );

  store.clear();
  const afterClear = store.getSnapshot();
  assert.equal(afterClear.notifications.length, 0, 'notifications cleared');
  assert.equal(afterClear.unreadCount, 0, 'unread count resets');

  const beforeLoad = afterClear.activity.length;
  store.loadMore();
  const afterLoad = store.getSnapshot();
  assert.ok(afterLoad.activity.length > beforeLoad, 'loadMore appends activity');
});
