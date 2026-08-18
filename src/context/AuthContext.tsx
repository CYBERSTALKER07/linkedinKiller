import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  role: 'student' | 'employer' | 'admin';
  company_name?: string | null;
  title?: string | null;
  location?: string | null;
  verified?: boolean;
  created_at: string;
  updated_at: string;
  university_id?: string;
  subscription_tier?: 'free' | 'student_premium' | 'university_premium';
}

interface User {
  id: string;
  email: string;
  role: 'student' | 'employer' | 'admin';
  profile: UserProfile;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, options?: { full_name?: string; username?: string; role?: 'student' | 'employer' }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const MOCK_AUTH_STORAGE_KEY = 'linkedinkiller_mock_auth_user';
const MOCK_AUTH_PASSWORD = 'password123';

const mockUsers: Array<{ email: string; password: string; role: User['role']; full_name: string; username: string }> = [
  { email: 'student@example.com', password: MOCK_AUTH_PASSWORD, role: 'student', full_name: 'Demo Student', username: 'demo-student' },
  { email: 'employer@example.com', password: MOCK_AUTH_PASSWORD, role: 'employer', full_name: 'Demo Employer', username: 'demo-employer' },
  { email: 'admin@example.com', password: MOCK_AUTH_PASSWORD, role: 'admin', full_name: 'Demo Admin', username: 'demo-admin' },
];

const getStoredMockUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  try {
    const rawUser = window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) as User : null;
  } catch {
    return null;
  }
};

const saveStoredMockUser = (user: User | null) => {
  if (typeof window === 'undefined') return;

  if (user) {
    window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  }
};

const getMockUserForCredentials = (email: string, password: string): User | null => {
  const mockUser = mockUsers.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password);

  if (!mockUser) return null;

  const profile: UserProfile = {
    id: `mock-${mockUser.username}`,
    username: mockUser.username,
    full_name: mockUser.full_name,
    bio: 'Mock account for local development',
    avatar_url: null,
    website: null,
    role: mockUser.role,
    company_name: mockUser.role === 'employer' ? 'Mock Company' : null,
    title: mockUser.role === 'employer' ? 'Hiring Manager' : null,
    location: 'Remote',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subscription_tier: mockUser.role === 'admin' ? 'university_premium' : 'student_premium',
  };

  return {
    id: profile.id,
    email: mockUser.email,
    role: mockUser.role,
    profile,
  };
};

// Cache for profile data to avoid redundant queries
const profileCache = new Map<string, UserProfile>();

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authInitializedRef = useRef(false);

  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser, skipCache = false) => {
    try {
      // Check cache first
      if (!skipCache && profileCache.has(supabaseUser.id)) {
        const cachedProfile = profileCache.get(supabaseUser.id)!;
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          role: cachedProfile.role || 'student',
          profile: cachedProfile
        };
        setUser(user);
        setLoading(false);
        return;
      }

      // Fetch profile from profiles table with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      clearTimeout(timeoutId);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      if (profile) {
        // Cache the profile
        const premiumProfile = { ...profile, subscription_tier: 'student_premium' as const };
        profileCache.set(supabaseUser.id, premiumProfile);
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          role: profile.role || 'student',
          profile: premiumProfile
        };
        setUser(user);
      } else {
        // Create profile if it doesn't exist - this shouldn't happen after signup optimization
        const newProfile: UserProfile = {
          id: supabaseUser.id,
          username: supabaseUser.email?.split('@')[0] || '',
          full_name: supabaseUser.user_metadata?.full_name || null,
          bio: null,
          avatar_url: null,
          website: null,
          role: (supabaseUser.user_metadata?.role || 'student') as 'student' | 'employer' | 'admin',
          company_name: null,
          title: null,
          location: null,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          subscription_tier: 'student_premium'
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Use local profile data even if DB fails
          profileCache.set(supabaseUser.id, newProfile);
          const basicUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            role: 'student',
            profile: newProfile
          };
          setUser(basicUser);
        } else if (createdProfile) {
          const premiumCreatedProfile = { ...createdProfile, subscription_tier: 'student_premium' as const };
          profileCache.set(supabaseUser.id, premiumCreatedProfile);
          const user: User = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            role: createdProfile.role || 'student',
            profile: premiumCreatedProfile
          };
          setUser(user);
        }
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only run initialization once per page load
    if (authInitializedRef.current) {
      setLoading(false);
      return;
    }

    authInitializedRef.current = true;

    // Check active sessions and sets the user
    const initAuth = async () => {
      try {
        const storedMockUser = getStoredMockUser();
        if (storedMockUser) {
          setUser(storedMockUser);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
        // Clear cache on logout
        profileCache.clear();
        authInitializedRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const createProfileForNewUser = async (
    userId: string,
    email: string,
    metadata: { full_name?: string; username?: string; role?: 'student' | 'employer' }
  ): Promise<UserProfile | null> => {
    try {
      const newProfile: UserProfile = {
        id: userId,
        username: metadata.username || email.split('@')[0],
        full_name: metadata.full_name || null,
        bio: null,
        avatar_url: null,
        website: null,
        role: (metadata.role || 'student') as 'student' | 'employer' | 'admin',
        company_name: null,
        title: null,
        location: null,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subscription_tier: 'student_premium'
      };

      const { data: createdProfile, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      profileCache.set(userId, createdProfile);
      return createdProfile;
    } catch (error) {
      console.error('Error in createProfileForNewUser:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);

      const mockUser = getMockUserForCredentials(email, password);
      if (mockUser) {
        saveStoredMockUser(mockUser);
        setUser(mockUser);
        setLoading(false);
        return { error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error: new Error(error.message) };
      }

      if (data.user) {
        await loadUserProfile(data.user, true);
        return { error: null };
      }

      setLoading(false);
      return { error: new Error('Sign in failed. Please try again.') };
    } catch (error) {
      setLoading(false);
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    options?: { full_name?: string; username?: string; role?: 'student' | 'employer' }
  ): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options?.full_name || '',
            username: options?.username || email.split('@')[0],
            role: options?.role || 'student'
          }
        }
      });

      if (error) {
        setLoading(false);
        return { error: new Error(error.message) };
      }

      if (data.user) {
        // Create profile immediately after successful signup
        const profile = await createProfileForNewUser(data.user.id, email, {
          full_name: options?.full_name,
          username: options?.username,
          role: options?.role
        });

        if (data.session && profile) {
          // Auto-login successful
          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            role: profile.role || 'student',
            profile: profile
          };
          setUser(user);
        } else if (!data.session) {
          // Email confirmation required
          setLoading(false);
          return { error: new Error('Please check your email to confirm your account.') };
        }
      }

      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      const storedMockUser = getStoredMockUser();
      if (storedMockUser) {
        saveStoredMockUser(null);
        setUser(null);
        profileCache.clear();
        authInitializedRef.current = false;
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      profileCache.clear();
      authInitializedRef.current = false;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = signOut;

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update cache
      profileCache.set(user.id, data);
      setUser({
        ...user,
        profile: data
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    logout,
    updateProfile,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
export type { AuthContextType, User, UserProfile };

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}