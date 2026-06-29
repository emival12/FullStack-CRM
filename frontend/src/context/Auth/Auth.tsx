import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ENDPOINTS } from "@/api/endpoints";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";

import type {
  AuthContextType,
  AuthProviderProps,
  LoginBody,
  LoginData,
  LoginFunc,
  UserData,
} from "./Auth.types";

//Creation of context (place where i can save things and avoid the props)
const AuthContext = createContext<AuthContextType | null>(null);

// This is just a shotcut to avoid to repeat for every component the "useContext(AuthContext)"
// because to use useContext(AuthContext) you have to import all the time AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [checkSession] = useState(() => !!localStorage.getItem("userToken"));
  const [user, setUser] = useState<UserData | null>(null);

  const { mutate } = useApiMutation<LoginBody, LoginData>(
    ENDPOINTS.auth.login,
    "post",
  );
  const {
    data: userData,
    loading,
    error,
  } = useApiQuery<UserData>(ENDPOINTS.auth.currentUser, {
    enabled: checkSession,
  });

  // localStorage is a internal dictionary of the browser
  const logout = useCallback(() => {
    localStorage.removeItem("userToken");
    setUser(null);
  }, []);

  const login: LoginFunc = useCallback(
    async (email, password) => {
      const payload: LoginBody = { email, password };
      const userData = await mutate(payload);

      localStorage.setItem("userToken", userData.token);
      setUser(userData.user);
      return userData;
    },
    [mutate],
  );

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData]);

  useEffect(() => {
    if (error) logout();
  }, [error, logout]);

  // All the things passed in the values are available to all the components who read the context
  // children: are all the components inside the AuthProvider (in our case the entire App)
  const value = useMemo(
    () => ({ user, login, logout, loading }),
    [user, login, logout, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
