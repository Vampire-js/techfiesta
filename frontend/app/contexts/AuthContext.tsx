"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";


export interface User {
    id: string;
    username: string;
    name: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    signup: (username: string, password: string, name: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await apiFetch("/auth/me", {
                method: "GET",
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        const res = await apiFetch("/auth/login", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "email": username, "password": password })
        });

        if (!res.ok) return false;

        await fetchUser();
        router.push("/");
        return true;
    };

    const signup = async (
        username: string,
        password: string,
        name: string
    ): Promise<boolean> => {
        const res = await apiFetch("/auth/signup", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "email": username, "password":password, "name":name }),
        });

        return res.ok;
    };

    const logout = async (): Promise<void> => {
        await apiFetch("/auth/logout", {
            method: "GET",
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
        });
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
