export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface FileActivity {
  id?: number;
  user_id?: number;
  file_path: string;
  file_name: string;
  file_size: number;
  modified_at: string;
  last_synced?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Config {
  apiUrl: string;
  token?: string;
}

