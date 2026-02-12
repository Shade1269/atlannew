import test from 'node:test';
import assert from 'node:assert/strict';
import { performSignUpRuntime as performSignUp } from '../src/hooks/performSignUpRuntime.js';

const createSupabaseStub = () => {
  const upsertCalls = [];

  const queryBuilder = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    maybeSingle: async () => ({ data: null, error: null }),
    upsert(payload) {
      upsertCalls.push({ table: this.table, payload: Array.isArray(payload) ? payload[0] : payload });
      return {
        select() {
          return this;
        },
        maybeSingle: async () => ({ data: null, error: null })
      };
    },
  };

  const supabase = {
    from(table) {
      const builder = Object.create(queryBuilder);
      builder.table = table;
      return builder;
    },
    auth: {
      signUp: async () => ({
        data: { user: { id: 'user-123', email: 'affiliate@example.com' } },
        error: null,
      }),
    },
  };

  return { supabase, upsertCalls };
};

test('performSignUp persists selected role into profiles table', async () => {
  const { supabase, upsertCalls } = createSupabaseStub();
  const toastMessages = [];
  const toast = (config) => toastMessages.push(config);
  const fetchUserProfile = async () => null;

  await performSignUp(
    { supabase, toast, fetchUserProfile, getBaseUrlFn: () => 'https://example.com' },
    {
      email: 'affiliate@example.com',
      password: 'Password1!',
      fullName: 'Affiliate Name',
      username: 'affiliate_handle',
      role: 'affiliate',
    }
  );

  const profileCall = upsertCalls.find((call) => call.table === 'profiles');
  assert.ok(profileCall, 'expected profiles upsert call');
  assert.equal(profileCall.payload.role, 'affiliate');
});
