const tokenKey = "expense-tracker-token";
const userKey = "expense-tracker-user";

export const authStorage = {
  getToken: () => window.localStorage.getItem(tokenKey),
  setToken: (token: string) => window.localStorage.setItem(tokenKey, token),
  clearToken: () => window.localStorage.removeItem(tokenKey),
  getUser: () => {
    const raw = window.localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: unknown) => window.localStorage.setItem(userKey, JSON.stringify(user)),
  clearUser: () => window.localStorage.removeItem(userKey),
};
