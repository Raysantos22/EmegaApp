// src/screens/LoginScreen.js - Updated navigation
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext'; // Use the AuthContext instead of direct Supabase

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Use the auth context
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        result = await signUp(email, password);
        if (!result.error) {
          Alert.alert('Success', 'Check your email for verification link!');
        }
      } else {
        result = await signIn(email, password);
        // Navigation is handled automatically by the AuthProvider
        // No need to manually navigate - the AppNavigator will handle it
      }

      if (result.error) {
        Alert.alert('Error', result.error.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isTablet) {
    // Tablet/Desktop layout - Side by side
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Left Panel - Red with Logo */}
              <LinearGradient
                colors={['#ffffffff', '#ffffffff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.leftPanel}
              >
                <Image
                  source={{ 
                    uri: 'https://emega.com.au/wp-content/uploads/2023/10/mega-shop-australia.png' 
                  }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>

              {/* Right Panel - Login Form */}
              <View style={styles.rightPanel}>
                <LoginForm 
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  loading={loading}
                  isSignUp={isSignUp}
                  setIsSignUp={setIsSignUp}
                  handleAuth={handleAuth}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Mobile layout - Stacked
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.mobileScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mobileCard}>
            {/* Top Panel - Red with Logo */}
            <LinearGradient
              colors={['#ffffffff', '#ffffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mobileTopPanel}
            >
              <Image
                source={{ 
                  uri: 'https://emega.com.au/wp-content/uploads/2023/10/mega-shop-australia.png' 
                }}
                style={styles.mobileLogo}
                resizeMode="contain"
              />
              {/* <Text style={styles.mobileTitle}>EMEGA</Text>
              <Text style={styles.mobileSubtitle}>Admin Dashboard</Text> */}
            </LinearGradient>

            {/* Bottom Panel - Login Form */}
            <View style={styles.mobileBottomPanel}>
              <LoginForm 
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                isSignUp={isSignUp}
                setIsSignUp={setIsSignUp}
                handleAuth={handleAuth}
                isMobile={true}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Reusable Login Form Component
function LoginForm({ 
  email, setEmail, password, setPassword, 
  loading, isSignUp, setIsSignUp, handleAuth, isMobile = false 
}) {
  const { resetPassword } = useAuth();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      const result = await resetPassword(email);
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        Alert.alert('Success', 'Password reset link sent to your email!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email');
    }
  };

  return (
    <>
      {/* Header */}
      <View style={isMobile ? styles.mobileHeader : styles.header}>
        <Text style={isMobile ? styles.mobileFormTitle : styles.title}>
          {isSignUp ? 'Sign Up' : 'Log In'}
        </Text>
        <Text style={isMobile ? styles.mobileFormSubtitle : styles.subtitle}>
          {isSignUp 
            ? 'Create your account to get started'
            : 'Enter your email and password to login our dashboard'
          }
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="info@emegahcs.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.linkText}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>
          </TouchableOpacity>
          
          {!isSignUp && (
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  mobileScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  
  // Tablet/Desktop Card Layout
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    minHeight: 400,
  },
  leftPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  logo: {
    width: 300,
    height: 200,
    tintColor: 'white',
  },
  rightPanel: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  
  // Mobile Card Layout
  mobileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  mobileTopPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    // paddingHorizontal: 32,
  },
  mobileLogo: {
    width: 150,
    height: 50,
    tintColor: '#d30000ff',
    // marginBottom: 16,
  },
  mobileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  mobileSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mobileBottomPanel: {
    padding: 32,
  },
  
  // Headers
  header: {
    marginBottom: 24,
  },
  mobileHeader: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  mobileFormTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  mobileFormSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  
  // Form
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: '#DC2626',
    fontSize: 12,
  },
});