import * as vscode from 'vscode';
import { LocalDatabase } from './database';
import { ApiClient } from './apiClient';
import { Task, FileActivity } from './types';

export class SyncManager {
  private db: LocalDatabase;
  private api: ApiClient;
  private isOnline: boolean = true;
  private syncInterval: any = null;

  constructor(db: LocalDatabase, api: ApiClient) {
    this.db = db;
    this.api = api;
    this.checkOnlineStatus();
  }

  private async checkOnlineStatus(): Promise<void> {
    try {
      await this.api.getMe();
      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
    }
  }

  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncInterval = setInterval(async () => {
      await this.sync();
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<{ tasks: number; files: number; error?: string }> {
    try {
      await this.checkOnlineStatus();
      
      if (!this.isOnline) {
        return { tasks: 0, files: 0, error: 'Нет подключения к интернету' };
      }

      let syncedTasks = 0;
      let syncedFiles = 0;
      try {
        const serverTasks = await this.api.getTasks();
        for (const task of serverTasks) {
          this.db.saveTask(task, true);
        }
        const unsyncedTasks = this.db.getUnsyncedTasks();
        for (const task of unsyncedTasks) {
          try {
            if (task.id) {
              await this.api.updateTask(task.id, task);
            } else {
              const created = await this.api.createTask(task);
              this.db.saveTask(created, true);
            }
            this.db.markTaskSynced(task.id);
            syncedTasks++;
          } catch (error) {
          }
        }
      } catch (error) {
      }
      try {
        const unsyncedFiles = this.db.getUnsyncedFileActivities();
        if (unsyncedFiles.length > 0) {
          const result = await this.api.syncFileActivities(unsyncedFiles);
          syncedFiles = result.synced;
          for (const activity of unsyncedFiles) {
            this.db.markFileActivitySynced(activity.file_path);
          }
        }
      } catch (error) {
      }

      return { tasks: syncedTasks, files: syncedFiles };
    } catch (error: any) {
      return { 
        tasks: 0, 
        files: 0, 
        error: error.message || 'Ошибка синхронизации' 
      };
    }
  }

  isConnected(): boolean {
    return this.isOnline;
  }
}

