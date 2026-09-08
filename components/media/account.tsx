'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
export function Account({
  library,
  onLoad,
}: {
  library: unknown;
  onLoad: (value: unknown) => void;
}) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_KEY;
    return url && key
      ? createClient(url, key, { auth: { flowType: 'pkce' } })
      : null;
  }, []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data, error }) => {
      if (active) {
        setSession(data.session);
        if (error) setMessage(error.message);
      }
    });
    const { data } = client.auth.onAuthStateChange((_event, value) => {
      if (active) setSession(value);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Account request failed.');
    } finally {
      setBusy(false);
    }
  }
  if (!client)
    return (
      <details className="account-panel">
        <summary>Save across devices</summary>
        <p>
          Email sign-in is prepared but awaiting account-service setup. Your
          current library stays in this browser.
        </p>
      </details>
    );
  return (
    <details className="account-panel">
      <summary>
        {session ? 'Your account' : 'Sign in to save across devices'}
      </summary>
      {session ? (
        <>
          <p>Signed in as {session.user.email}</p>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const { data, error } = await client
                  .from('libraries')
                  .select('data')
                  .eq('user_id', session.user.id)
                  .maybeSingle();
                if (error) throw error;
                if (!data) {
                  setMessage('No cloud library yet. Save this library first.');
                  return;
                }
                onLoad(data.data);
                setMessage(
                  'Cloud library merged. Existing local ratings and tag edits take priority.',
                );
              })
            }
          >
            Merge saved cloud library
          </button>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const { error } = await client
                  .from('libraries')
                  .upsert({
                    user_id: session.user.id,
                    data: library,
                    updated_at: new Date().toISOString(),
                  });
                if (error) throw error;
                setMessage('This library is now saved to your account.');
              })
            }
          >
            Save this library to account
          </button>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const { error } = await client.auth.signOut();
                if (error) throw error;
                setMessage(
                  'Signed out. This browser still retains its local library.',
                );
              })
            }
          >
            Sign out
          </button>
          <p>
            Save replaces your account’s saved snapshot. Merge brings it into
            this browser. Sign out does not clear local data.
          </p>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (sent) {
                const { error } = await client.auth.verifyOtp({
                  email: email.trim(),
                  token: code.trim(),
                  type: 'email',
                });
                if (error) throw error;
                setCode('');
                setMessage(
                  'Signed in. Merge your cloud library or save this browser’s library.',
                );
              } else {
                const { error } = await client.auth.signInWithOtp({
                  email: email.trim(),
                });
                if (error) throw error;
                setSent(true);
                setMessage('Check your email for the sign-in code.');
              }
            });
          }}
        >
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={sent || busy}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {sent && (
            <label>
              Sign-in code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                maxLength={10}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          )}
          <button disabled={busy}>
            {busy
              ? 'Please wait…'
              : sent
                ? 'Verify code'
                : 'Email a sign-in code'}
          </button>
          {sent && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSent(false);
                setCode('');
              }}
            >
              Use another email / resend
            </button>
          )}
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}
