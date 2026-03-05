export type UserRole = 'student' | 'professor' | 'admin';

export type BeltRank = 
  | 'branca' 
  | 'cinza' 
  | 'azul' 
  | 'amarela' 
  | 'laranja' 
  | 'verde' 
  | 'roxa' 
  | 'marrom' 
  | 'preta';

export interface BeltHistory {
  belt: BeltRank;
  date: string;
}

export interface CompetitionRecord {
  name: string;
  date: string;
  result: string; // e.g. "Campeão", "Vice", "3º Lugar"
}

export interface CourseRecord {
  name: string;
  date: string;
  type: 'técnico' | 'arbitragem' | 'outro';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  belt: BeltRank;
  dojoId: string;
  phone?: string;
  birthDate: string; // Mandatory
  createdAt: string;
  tuitionStatus: 'up-to-date' | 'overdue';
  tuitionDueDate?: string;
  customTuitionValue?: number; // Optional override for specific students
  association?: string; // Clube ou academia atual
  beltHistory?: BeltHistory[];
  competitions?: CompetitionRecord[];
  courses?: CourseRecord[];
}

export interface Dojo {
  id: string;
  name: string;
  address: string;
}

export interface ClassSession {
  id: string;
  dojoId: string;
  professorId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[]; // 0-6
  students: string[]; // UIDs
  tuitionValue: number; // Base tuition for this class
  maxStudents?: number;
  minAge?: number;
  maxAge?: number;
  ageRange?: string; // e.g. "5-10", "Livre"
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  presentStudents: string[];
  absentStudents: string[];
}

export interface Championship {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  registrations: string[]; // UIDs
  status: 'open' | 'closed' | 'finished';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'billing' | 'exam' | 'announcement';
  read: boolean;
  createdAt: string;
}
