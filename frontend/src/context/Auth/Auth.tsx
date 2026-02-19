import axios from "axios";
import { createContext, useContext, useState, useEffect } from "react";
import type {
  AuthContextType,
  AuthProviderProps,
  UserData,
  LoginFunc,
} from "./Auth.types";

import { API_BASE_URL } from "config/K";

//Creation of context (place where i can save things and avoid the props)
const AuthContext = createContext<AuthContextType | null>(null);

// This is just a shotcut to avoid to repeat for every component the "useContext(AuthContext)"
// because to use useContext(AuthContext) you have to import all the time AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere usato all'interno di un AuthProvider");
  }

  return context;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  // localStorage is a internal dictionary of the browser
  const logout = () => {
    localStorage.removeItem("userToken");
    setUser(null);
  };

  const login: LoginFunc = async (email, password) => {
    const apiData = {
      email: email,
      password: password,
    };

    return axios
      .post<UserData>(`${API_BASE_URL}/login`, apiData)
      .then((res) => {
        console.log("AuthProvider - login result:", res.data);

        setUser(res.data);
        localStorage.setItem("userToken", JSON.stringify(res.data));
        return res;
      })
      .catch((err) => {
        console.error("AuthProvider - login Error:", err);
        throw err;
      });
  };

  //On start check if a user is already logged
  useEffect(() => {
    const savedUser = localStorage.getItem("userToken");
    if (savedUser) {
      axios
        .post(`${API_BASE_URL}/check_connection`, savedUser)
        .then((res) => {
          console.log("AuthProvider - check connection result:", res.data);
          setUser(JSON.parse(savedUser) as UserData);
        })
        .catch((err) => {
          console.log("AuthProvider - check connection error:", err);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // All the things passed in the values are available to all the components who read the context
  // children: are all the components inside the AuthProvider (in our case the entire App)
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
