import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  systemRole: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  activeOrg: Organization | null;
  organizations: Organization[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerCompany: (payload: { companyName: string; fullName: string; email: string; password: string }) => Promise<void>;
  switchOrganization: (orgId: string) => void;
  logout: () => void;
  demoLogin: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const token = localStorage.getItem('garaa-token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const profile = await ApiClient.getProfile();
      setUser(profile.user);
      setOrganizations(profile.organizations || []);

      const savedOrgId = localStorage.getItem('garaa-org-id');
      const matched = profile.organizations?.find((o: Organization) => o.id === savedOrgId) || profile.organizations?.[0];
      if (matched) {
        setActiveOrg(matched);
        localStorage.setItem('garaa-org-id', matched.id);
      }
    } catch (err) {
      console.warn('Session expired or invalid, logging out.');
      localStorage.removeItem('garaa-token');
      localStorage.removeItem('garaa-org-id');
      setUser(null);
      setActiveOrg(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await ApiClient.login({ email, password });
    localStorage.setItem('garaa-token', res.token);
    setUser(res.user);
    setOrganizations(res.organizations || []);
    if (res.activeOrganization) {
      setActiveOrg(res.activeOrganization);
      localStorage.setItem('garaa-org-id', res.activeOrganization.id);
    }
  };

  const registerCompany = async (payload: { companyName: string; fullName: string; email: string; password: string }) => {
    const res = await ApiClient.register(payload);
    localStorage.setItem('garaa-token', res.token);
    setUser(res.user);
    const org = res.organization;
    setActiveOrg(org);
    setOrganizations([org]);
    localStorage.setItem('garaa-org-id', org.id);
  };

  const switchOrganization = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (target) {
      setActiveOrg(target);
      localStorage.setItem('garaa-org-id', target.id);
      window.location.reload();
    }
  };

  const logout = () => {
    localStorage.removeItem('garaa-token');
    localStorage.removeItem('garaa-org-id');
    setUser(null);
    setActiveOrg(null);
    setOrganizations([]);
  };

  const demoLogin = async (email: string) => {
    await login(email, 'Garaa@2026!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        organizations,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerCompany,
        switchOrganization,
        logout,
        demoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
