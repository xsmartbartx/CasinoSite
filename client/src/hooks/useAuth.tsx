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

      // Check if user is already logged in
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    } else {
      setUser(null);
    }
  }, [data]);

    // Register mutation
    const registerMutation = useMutation<User, Error, { username: string; password: string }>({
        mutationFn: async (credentials) => {
          const res = await apiRequest("POST", "/api/auth/register", credentials);
          return await res.json();
        },
        onSuccess: (data) => {
            setUser(data);
            toast({
              title: "Registration successful",
              description: "Welcome to EduCasino!",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
          },