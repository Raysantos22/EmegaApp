import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://msbqgxjbsxztcnkxziju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYnFneGpic3h6dGNua3h6aWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA5ODgsImV4cCI6MjA3MzYwNjk4OH0.JkMIH03-rWdllFLTTuTzbGk_m-v9C47kNqUZLOA2VdI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
          
          // Update last login
          if (event === 'SIGNED_IN') {
            await updateLastLogin(session.user.id);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
        setInitialized(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error in getInitialSession:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const updateLastLogin = async (userId) => {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, additionalData = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: additionalData,
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      // Update auth user metadata if needed
      if (updates.full_name || updates.avatar_url) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: updates.full_name,
            avatar_url: updates.avatar_url,
          }
        });

        if (authError) throw authError;
      }

      // Update user profile table
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// HOC for protecting screens that require authentication
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { user, loading, initialized } = useAuth();

    if (!initialized || loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
        </View>
      );
    }

    if (!user) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 }}>
            Please login to access this feature
          </Text>
          <TouchableOpacity 
            style={{
              backgroundColor: '#DC2626',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => props.navigation.navigate('Login')}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
              Go to Login
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <Component {...props} />;
  };
};