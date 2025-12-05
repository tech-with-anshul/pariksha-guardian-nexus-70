import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define user types
export type UserRole = "faculty" | "student" | "admin" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  erpId: string;
  department?: string;
  course?: string;
  permissions?: string[];
}

// Define mock user type that includes password for local mock data
interface MockUser extends Omit<User, "id"> {
  id: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<User, "id"> & { password: string }) => Promise<boolean>;
  updateUser: (id: string, userData: Partial<User> & { password?: string }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getUsers: (role: UserRole) => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default permissions by role
const DEFAULT_PERMISSIONS = {
  admin: ["all", "manage_users", "manage_tests", "manage_system"],
  faculty: ["create_test", "view_results", "manage_own_tests"],
  student: ["take_test", "view_own_results"]
};

// Mock user data with updated properties - using proper UUIDs matching database
const MOCK_USERS: Record<string, MockUser[]> = {
  faculty: [
    { id: "11111111-1111-1111-1111-111111111111", name: "Dr. Jane Smith", email: "jane@faculty.edu", erpId: "DBUUF001", password: "123456", role: "faculty", department: "Computer Science", permissions: [...DEFAULT_PERMISSIONS.faculty] },
    { id: "22222222-2222-2222-2222-222222222222", name: "Prof. John Doe", email: "john@faculty.edu", erpId: "DBUUF002", password: "password123", role: "faculty", department: "Mathematics", permissions: [...DEFAULT_PERMISSIONS.faculty] },
    { id: "33333333-3333-3333-3333-333333333333", name: "Mr. Yudhveer Singh Moudgil", email: "yudhveer@faculty.edu", erpId: "DBUUF003", password: "123456", role: "faculty", department: "Computer Science", permissions: [...DEFAULT_PERMISSIONS.faculty] },
    { id: "f1", name: "Dr. Rajesh Kumar", email: "rajesh@pariksha.edu", erpId: "DBUUF001", password: "123456", role: "faculty", department: "Computer Science", permissions: ["create_test", "manage_users", "view_analytics"] },
    { id: "f2", name: "Prof. Priya Sharma", email: "priya@pariksha.edu", erpId: "DBUUF002", password: "faculty123", role: "faculty", department: "Mathematics", permissions: ["create_test", "view_analytics"] },
    { id: "f3", name: "Dr. Amit Patel", email: "amit@pariksha.edu", erpId: "DBUUF003", password: "faculty123", role: "faculty", department: "Physics", permissions: ["create_test", "view_analytics", "moderate_exams"] },
  ],
  student: [
    { id: "44444444-4444-4444-4444-444444444444", name: "Alex Johnson", email: "alex@student.edu", erpId: "22BTCSE0100", password: "password123", role: "student", course: "Computer Science", permissions: [...DEFAULT_PERMISSIONS.student] },
    { id: "55555555-5555-5555-5555-555555555555", name: "Sam Williams", email: "sam@student.edu", erpId: "22BTCSE0101", password: "password123", role: "student", course: "Mathematics", permissions: [...DEFAULT_PERMISSIONS.student] },
    { id: "66666666-6666-6666-6666-666666666666", name: "Anshul", email: "anshul@student.edu", erpId: "22BTCSE0200", password: "24042004", role: "student", course: "Computer Science", permissions: [...DEFAULT_PERMISSIONS.student] },
    { id: "s1", name: "Rahul Verma", email: "rahul@student.pariksha.edu", erpId: "22BTCSE0200", password: "24042004", role: "student", course: "Computer Science" },
    { id: "s2", name: "Sneha Reddy", email: "sneha@student.pariksha.edu", erpId: "22BTCSE0201", password: "student123", role: "student", course: "Mathematics" },
    { id: "s3", name: "Arjun Singh", email: "arjun@student.pariksha.edu", erpId: "22BTCSE0202", password: "student123", role: "student", course: "Physics" },
  ],
  admin: [
    { id: "77777777-7777-7777-7777-777777777777", name: "Admin User", email: "admin@pariksha.edu", erpId: "ADMIN001", password: "admin123", role: "admin", permissions: [...DEFAULT_PERMISSIONS.admin] },
  ]
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, MockUser[]>>(MOCK_USERS);
  
  // Check for existing user in localStorage on mount
  useEffect(() => {
    const storedUserRaw = localStorage.getItem("pariksha_user");
    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw) as User;
        const isUuid = (v: string) => /^[0-9a-fA-F-]{36}$/.test(v);
        // Migrate legacy ids (f1/s1/a1) to UUIDs using email/erp mapping
        if (!isUuid(parsed.id)) {
          const allMock = [...MOCK_USERS.faculty, ...MOCK_USERS.student, ...MOCK_USERS.admin];
          const match = allMock.find(m => m.email === parsed.email || m.erpId === parsed.erpId);
          if (match) {
            const migrated: User = { ...parsed, id: match.id };
            setUser(migrated);
            localStorage.setItem("pariksha_user", JSON.stringify(migrated));
          } else {
            setUser(parsed);
          }
        } else {
          setUser(parsed);
        }
      } catch {}
    }

    // Check for stored users data
    const storedUsersData = localStorage.getItem("pariksha_users_data");
    if (storedUsersData) {
      setUsers(JSON.parse(storedUsersData));
    } else {
      // Initialize localStorage with mock data if not present
      localStorage.setItem("pariksha_users_data", JSON.stringify(MOCK_USERS));
    }

    // Initialize local data
    initializeLocalData();
  }, []);

  const initializeLocalData = () => {
    // Initialize localStorage with mock data if not present
    const storedUsersData = localStorage.getItem("pariksha_users_data");
    if (!storedUsersData) {
      localStorage.setItem("pariksha_users_data", JSON.stringify(MOCK_USERS));
    }
  };

  const login = async (identifier: string, password: string, role: UserRole): Promise<boolean> => {
    // Use only local mock login
    let roleUsers: MockUser[] = [];
    if (role === "faculty") {
      roleUsers = users.faculty;
    } else if (role === "student") {
      roleUsers = users.student;
    } else if (role === "admin") {
      roleUsers = users.admin;
    } else {
      return false;
    }

    const mockUser = roleUsers.find((u) => 
      // For admin, use email as identifier
      (role === "admin" && u.email === identifier && u.password === password) ||
      // For faculty and students, check either email or erpId
      (role !== "admin" && ((u.email === identifier || u.erpId === identifier) && u.password === password))
    );

    if (mockUser) {
      // Remove password before storing
      const { password: _, ...secureUser } = mockUser;
      setUser(secureUser);
      localStorage.setItem("pariksha_user", JSON.stringify(secureUser));
      return true;
    }
    return false;
  };

  const logout = async () => {
    // Clear local state only
    setUser(null);
    localStorage.removeItem("pariksha_user");
  };

  const addUser = async (userData: Omit<User, "id"> & { password: string }): Promise<boolean> => {
    const { role, name, email, password } = userData;
    if (!role || (role !== "faculty" && role !== "student" && role !== "admin")) {
      return false;
    }

    try {
      // Call edge function to create user in Supabase
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email,
          password,
          full_name: name,
          role,
        },
      });

      if (error) {
        console.error("Error creating user:", error);
        return false;
      }

      if (!data.success) {
        console.error("Failed to create user:", data.error);
        return false;
      }

      // Also add to local state for immediate UI update
      const newId = data.user.id;
      
      let newUser: MockUser;
      
      if (role === "faculty") {
        newUser = {
          ...userData,
          id: newId,
          department: userData.department || "Unknown",
          permissions: userData.permissions || [...DEFAULT_PERMISSIONS[role]],
        } as MockUser;
      } else if (role === "student") {
        newUser = {
          ...userData,
          id: newId, 
          course: userData.course || "Unknown",
          permissions: userData.permissions || [...DEFAULT_PERMISSIONS[role]],
        } as MockUser;
      } else {
        newUser = {
          ...userData,
          id: newId,
          permissions: userData.permissions || [...DEFAULT_PERMISSIONS[role]],
        } as MockUser;
      }

      const updatedUsers = { ...users };
      updatedUsers[role] = [...updatedUsers[role], newUser];
      
      setUsers(updatedUsers);
      localStorage.setItem("pariksha_users_data", JSON.stringify(updatedUsers));
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      return false;
    }
  };

  const updateUser = async (id: string, userData: Partial<User> & { password?: string }): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedUsers = { ...users };
    let userFound = false;

    // Determine role based on UUID mapping
    let role: string;
    if (id === "11111111-1111-1111-1111-111111111111" || id === "22222222-2222-2222-2222-222222222222" || id === "33333333-3333-3333-3333-333333333333") {
      role = "faculty";
    } else if (id === "44444444-4444-4444-4444-444444444444" || id === "55555555-5555-5555-5555-555555555555" || id === "66666666-6666-6666-6666-666666666666") {
      role = "student";
    } else if (id === "77777777-7777-7777-7777-777777777777") {
      role = "admin";
    } else {
      // For new users, try to find role from existing data
      const allUsers = [...users.faculty, ...users.student, ...users.admin];
      const foundUser = allUsers.find(u => u.id === id);
      role = foundUser?.role || "student";
    }
    
    updatedUsers[role] = updatedUsers[role].map(u => {
      if (u.id === id) {
        userFound = true;
        return { ...u, ...userData };
      }
      return u;
    });

    if (!userFound) {
      return false;
    }

    setUsers(updatedUsers);
    localStorage.setItem("pariksha_users_data", JSON.stringify(updatedUsers));
    
    if (user && user.id === id) {
      const updatedCurrentUser = updatedUsers[role].find(u => u.id === id);
      if (updatedCurrentUser) {
        const { password: _, ...secureUser } = updatedCurrentUser;
        setUser(secureUser);
        localStorage.setItem("pariksha_user", JSON.stringify(secureUser));
      }
    }
    
    return true;
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedUsers = { ...users };
    let userFound = false;

    // Determine role based on UUID mapping
    let role: string;
    if (id === "11111111-1111-1111-1111-111111111111" || id === "22222222-2222-2222-2222-222222222222" || id === "33333333-3333-3333-3333-333333333333") {
      role = "faculty";
    } else if (id === "44444444-4444-4444-4444-444444444444" || id === "55555555-5555-5555-5555-555555555555" || id === "66666666-6666-6666-6666-666666666666") {
      role = "student";
    } else if (id === "77777777-7777-7777-7777-777777777777") {
      role = "admin";
    } else {
      // For new users, try to find role from existing data
      const allUsers = [...users.faculty, ...users.student, ...users.admin];
      const foundUser = allUsers.find(u => u.id === id);
      role = foundUser?.role || "student";
    }
    
    if (role === "admin" && updatedUsers.admin.length <= 1) {
      return false;
    }

    updatedUsers[role] = updatedUsers[role].filter(u => {
      if (u.id === id) {
        userFound = true;
        return false;
      }
      return true;
    });

    if (!userFound) {
      return false;
    }

    setUsers(updatedUsers);
    localStorage.setItem("pariksha_users_data", JSON.stringify(updatedUsers));
    
    if (user && user.id === id) {
      logout();
    }
    
    return true;
  };

  const getUsers = async (role: UserRole): Promise<User[]> => {
    if (!role || (role !== "faculty" && role !== "student" && role !== "admin")) {
      return [];
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return users[role].map(({ password: _, ...user }) => user);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      addUser,
      updateUser,
      deleteUser,
      getUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
