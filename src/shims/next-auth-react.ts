// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn = (...args: any[]) => {
  if (typeof window !== 'undefined') {
    return fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify(args[0]) }).then(() => window.location.reload());
  }
  return Promise.resolve({ error: 'Not available' });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut = (...args: any[]) => {
  if (typeof window !== 'undefined') {
    return fetch('/api/auth/signout', { method: 'POST' }).then(() => {
      window.location.href = args?.[0]?.callbackUrl || '/login';
    });
  }
  return Promise.resolve({ url: '/' });
};

export const useSession = () => [{ data: null, status: 'unauthenticated' as const }, () => {}];
export const getSession = () => Promise.resolve(null);
