
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface Question {
  id: string;
  type: "mcq" | "essay" | "truefalse" | "short" | "long" | "image" | "coding";
  text: string;
  options?: string[];
  correctAnswer?: string | boolean;
  marks: number;
  answerHint?: string;
  imagePrompt?: string;
  codingLanguage?: string;
  starterCode?: string;
  expectedOutput?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description?: string;
  }>;
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  questions: Question[];
  createdBy: string;
  createdAt: Date;
  status: "draft" | "published";
  unique_id?: string;
}

interface TestContextType {
  tests: Test[];
  isLoading: boolean;
  createTest: (test: Omit<Test, "id" | "createdAt">) => Promise<void>;
  getTestById: (id: string) => Test | undefined;
  updateTest: (id: string, test: Partial<Test>) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  generateUniqueTestId: () => string;
  refreshTests: () => Promise<void>;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

const STORAGE_KEY = "pariksha_tests";

// Mock tests for demo
const MOCK_TESTS: Test[] = [
  {
    id: "test-001",
    title: "Introduction to Computer Science",
    subject: "Computer Science",
    duration: 60,
    createdBy: "11111111-1111-1111-1111-111111111111",
    createdAt: new Date("2024-01-15"),
    status: "published",
    unique_id: "TST-CS001",
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "What does CPU stand for?",
        options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"],
        correctAnswer: "Central Processing Unit",
        marks: 5,
      },
      {
        id: "q2",
        type: "mcq",
        text: "Which of the following is not an operating system?",
        options: ["Windows", "Linux", "Oracle", "macOS"],
        correctAnswer: "Oracle",
        marks: 5,
      },
      {
        id: "q3",
        type: "truefalse",
        text: "RAM is a type of permanent storage.",
        correctAnswer: false,
        marks: 3,
      },
    ],
  },
  {
    id: "test-002",
    title: "Basic Mathematics Quiz",
    subject: "Mathematics",
    duration: 45,
    createdBy: "22222222-2222-2222-2222-222222222222",
    createdAt: new Date("2024-01-20"),
    status: "published",
    unique_id: "TST-MATH01",
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "What is the value of π (pi) approximately?",
        options: ["3.14", "2.71", "1.41", "1.73"],
        correctAnswer: "3.14",
        marks: 5,
      },
      {
        id: "q2",
        type: "short",
        text: "Solve: 15 + 27 = ?",
        correctAnswer: "42",
        marks: 5,
      },
    ],
  },
];

export function TestProvider({ children }: { children: ReactNode }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load tests from localStorage on mount
  useEffect(() => {
    const storedTests = localStorage.getItem(STORAGE_KEY);
    if (storedTests) {
      try {
        const parsed = JSON.parse(storedTests);
        // Convert date strings back to Date objects
        const testsWithDates = parsed.map((test: any) => ({
          ...test,
          createdAt: new Date(test.createdAt),
        }));
        setTests(testsWithDates);
      } catch (error) {
        console.error("Error parsing stored tests:", error);
        // Initialize with mock tests if parsing fails
        setTests(MOCK_TESTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TESTS));
      }
    } else {
      // Initialize with mock tests
      setTests(MOCK_TESTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TESTS));
    }
    setIsLoading(false);
  }, []);

  // Save tests to localStorage whenever they change
  const saveToStorage = (updatedTests: Test[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTests));
  };

  const generateUniqueTestId = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TST-${randomPart}`;
  };

  const createTest = async (test: Omit<Test, "id" | "createdAt">) => {
    setIsLoading(true);

    try {
      const newTest: Test = {
        ...test,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        unique_id: test.unique_id || generateUniqueTestId(),
      };

      const updatedTests = [newTest, ...tests];
      setTests(updatedTests);
      saveToStorage(updatedTests);

      toast({
        title: "Success",
        description: "Test created successfully!",
      });
    } catch (error) {
      console.error("Error in createTest:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTest = async (id: string, updatedFields: Partial<Test>) => {
    setIsLoading(true);

    try {
      const updatedTests = tests.map((test) =>
        test.id === id ? { ...test, ...updatedFields } : test
      );
      setTests(updatedTests);
      saveToStorage(updatedTests);

      toast({
        title: "Success",
        description: "Test updated successfully!",
      });
    } catch (error) {
      console.error("Error in updateTest:", error);
      toast({
        title: "Error",
        description: "Failed to update test.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTest = async (id: string) => {
    setIsLoading(true);

    try {
      const updatedTests = tests.filter((test) => test.id !== id);
      setTests(updatedTests);
      saveToStorage(updatedTests);

      toast({
        title: "Success",
        description: "Test deleted successfully!",
      });
    } catch (error) {
      console.error("Error in deleteTest:", error);
      toast({
        title: "Error",
        description: "Failed to delete test.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTestById = (id: string) => {
    return tests.find((test) => test.id === id || test.unique_id === id);
  };

  const refreshTests = async () => {
    // Just reload from localStorage
    const storedTests = localStorage.getItem(STORAGE_KEY);
    if (storedTests) {
      try {
        const parsed = JSON.parse(storedTests);
        const testsWithDates = parsed.map((test: any) => ({
          ...test,
          createdAt: new Date(test.createdAt),
        }));
        setTests(testsWithDates);
      } catch (error) {
        console.error("Error refreshing tests:", error);
      }
    }
  };

  const value: TestContextType = {
    tests,
    isLoading,
    createTest,
    updateTest,
    deleteTest,
    getTestById,
    generateUniqueTestId,
    refreshTests,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
}

export function useTest() {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error("useTest must be used within a TestProvider");
  }
  return context;
}
