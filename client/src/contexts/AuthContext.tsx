import React, { createContext, useContext, useState, useEffect } from 'react';

// განვსაზღვროთ მომხმარებლის ტიპი
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
}

// კონტექსტის ტიპი
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// ვქმნით კონტექსტს
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// სატესტო მომხმარებელი
const TEST_USER: User = {
  id: '1',
  fullName: 'ტესტ მომხმარებელი',
  email: 'test@example.com',
  role: 'user'
};

// ადმინის მომხმარებელი
const ADMIN_USER: User = {
  id: '2',
  fullName: 'ადმინისტრატორი',
  email: 'admin@example.com',
  role: 'admin'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // სესიის აღდგენა გვერდის განახლების შემთხვევაში
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  // შესვლის ფუნქცია
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // ვემულაციებთ სერვერის პასუხს
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // შევამოწმოთ სატესტო მომხმარებლები
    let authenticatedUser: User | null = null;
    
    if (email === 'test@example.com' && password === 'password') {
      authenticatedUser = TEST_USER;
    } else if (email === 'admin@example.com' && password === 'adminpass') {
      authenticatedUser = ADMIN_USER;
    }
    
    if (authenticatedUser) {
      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  // გამოსვლის ფუნქცია
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// კონტექსტის გამოსაყენებელი ჰუკი
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
