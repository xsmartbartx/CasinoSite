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
          onError: (error: any) => {
            toast({
              title: "Registration failed",
              description: error.message || "Please try again with a different username",
              variant: "destructive",
            });
          },
        });

      // Login mutation
  const loginMutation = useMutation<User, Error, { username: string; password: string }>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
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
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error.message || "Please try again with a different username",
          variant: "destructive",
        });
      },
    });

      // Login mutation
  const loginMutation = useMutation<User, Error, { username: string; password: string }>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
        setUser(data);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      },
      onError: (error: any) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    });

      // Logout mutation
  const logoutMutation = useMutation<{message: string}, Error, void>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return await res.json();
    },
    onSuccess: () => {
        setUser(null);
        toast({
          title: "Logged out",
          description: "You have been logged out successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      },
      onError: (error: any) => {
        toast({
          title: "Logout failed",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      },
    });

    const register = async (username: string, password: string) => {
        await registerMutation.mutateAsync({ username, password });
      };

    const login = async (username: string, password: string) => {
        await loginMutation.mutateAsync({ username, password });
      };

    const logout = async () => {
        await logoutMutation.mutateAsync();
    };

    const updateBalance = (newBalance: number) => {
        if (user) {
          setUser({ ...user, balance: newBalance });
        }
      };

    return (
    <AuthContext.Provider
          value={{
            user,
            loading: isLoading,
            register,
            login,
            logout,
            updateBalance,
          }}
        >
         {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
    return useContext(AuthContext);
}