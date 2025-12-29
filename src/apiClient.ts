import axios, { AxiosInstance } from 'axios';
import { Task, FileActivity, AuthResponse, User } from './types';

export class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL: baseURL + '/api',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  setToken(token: string): void {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken(): void {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password
    });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      name
    });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/me');
    return response.data;
  }

  async getTasks(status?: string): Promise<Task[]> {
    const params = status ? { status } : {};
    const response = await this.client.get<Task[]>('/vscode/tasks', { params });
    return response.data;
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    const response = await this.client.post<Task>('/vscode/tasks', task);
    return response.data;
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    const response = await this.client.put<Task>(`/vscode/tasks/${id}`, task);
    return response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await this.client.delete(`/vscode/tasks/${id}`);
  }

  async getFileActivities(): Promise<FileActivity[]> {
    const response = await this.client.get<FileActivity[]>('/vscode/files');
    return response.data;
  }

  async createFileActivity(activity: FileActivity): Promise<FileActivity> {
    const response = await this.client.post<FileActivity>('/vscode/files', activity);
    return response.data;
  }

  async syncFileActivities(activities: FileActivity[]): Promise<{ synced: number; activities: FileActivity[] }> {
    const response = await this.client.post<{ synced: number; activities: FileActivity[] }>(
      '/vscode/files/sync',
      { activities }
    );
    return response.data;
  }

  async deleteFileActivity(id: number): Promise<void> {
    await this.client.delete(`/vscode/files/${id}`);
  }
}

