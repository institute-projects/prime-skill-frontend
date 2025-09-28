export interface Student {
  studentId: string;
  fullName: string;
  course: string;
  admissionYear: number;
  passYear: number;
  age: number;
  address: string;
  rollno: string;
  passportSizePhoto?: string; // base64 string for display
  certificate?: string; // base64 string for display
}

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}