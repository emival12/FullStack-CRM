import axios from "axios";
import { createContext, useContext, useState, useEffect } from "react";

import { API_BASE_URL } from "../config/K";

//Creation of context (place where i can save things and avoid the props)
const AuthContext = createContext();

// This is just a shotcut to avoid to repeat for every component the "useContext(AuthContext)"
// because to use useContext(AuthContext) you have to import all the time AuthContext
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // localStorage is a internal dictionary of the browser
  const logout = () => {
    localStorage.removeItem("userToken");
    setUser(null);
  };

  const login = async (email, password) => {
    const apiData = {
      email: email,
      password: password,
    };

    return axios
      .post(`${API_BASE_URL}/login`, apiData)
      .then((res) => {
        console.log("AuthProvider - result:", res.data);

        setUser(res.data);
        localStorage.setItem("userToken", JSON.stringify(res.data));
        return res;
      })
      .catch((err) => {
        console.error("AuthProvider - Error:", err);
        throw err;
      });
  };

  //On start check if a user is already logged
  useEffect(() => {
    const savedUser = localStorage.getItem("userToken");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // All the things passed in the values are available to all the components who read the context
  // children: are all the components inside the AuthProvider (in our case the entire App)
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
