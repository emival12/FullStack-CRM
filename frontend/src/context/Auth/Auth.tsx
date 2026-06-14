import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import client from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { useApiMutation } from "@/hooks/useApiMutation";

import type {
  AuthContextType,
  AuthProviderProps,
  LoginBody,
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
  const { mutate } = useApiMutation<LoginBody, UserData>(
    ENDPOINTS.auth.login,
    "post",
  );

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // localStorage is a internal dictionary of the browser
  const logout = useCallback(() => {
    localStorage.removeItem("userToken");
    setUser(null);
  }, []);

  const login: LoginFunc = useCallback(
    async (email, password) => {
      const payload: LoginBody = { email, password };
      const userData = await mutate(payload);

      setUser(userData);
      localStorage.setItem("userToken", JSON.stringify(userData));
      return userData;
    },
    [mutate],
  );

  //On start check if a user is already logged
  useEffect(() => {
    const savedUser = localStorage.getItem("userToken");
    if (savedUser) {
      client
        .post(ENDPOINTS.auth.checkConnection, savedUser)
        .then(() => {
          setUser(JSON.parse(savedUser) as UserData);
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [logout]);

  // All the things passed in the values are available to all the components who read the context
  // children: are all the components inside the AuthProvider (in our case the entire App)
  const value = useMemo(
    () => ({ user, login, logout, loading }),
    [user, login, logout, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
