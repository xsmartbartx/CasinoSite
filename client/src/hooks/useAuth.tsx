import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
    id: number;
    username: string;
    balance: number;
    createdAt: string;
    role: 'user' | 'admin' | 'superadmin';
    email?: string;
    lastLogin?: string;
    isActive?: boolean;
  }

  interface AuthContextType {
    user: User | null;
    loading: boolean;
    register: (username: string, password: string) => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateBalance: (newBalance: number) => void;
  }

  const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    register: async () => {},
    login: async () => {},
    logout: async () => {},
    updateBalance: () => {},
  });

  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();