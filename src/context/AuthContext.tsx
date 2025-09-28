// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;


interface AuthContextProps {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  console.log('API_URL:', API_URL); // Add this for debugging
    console.log('Full URL:', `${API_URL}/authenticate`); // Add this for debugging


  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.jwtToken) {
      setToken(data.jwtToken);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Login error:", err);
    return false;
  }
};


  const logout = () => {
    setToken(null);
        localStorage.removeItem("token");

  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
