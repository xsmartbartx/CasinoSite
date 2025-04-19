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