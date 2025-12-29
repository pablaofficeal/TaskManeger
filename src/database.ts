import * as vscode from 'vscode';
import { Task, FileActivity } from './types';

export class LocalDatabase {
  private storage: vscode.Memento;
  private tasksKey = 'taskmanager.tasks';
  private fileActivitiesKey = 'taskmanager.fileActivities';
  private configKey = 'taskmanager.config';

  constructor(context: vscode.ExtensionContext) {
    this.storage = context.globalState;
    this.initDatabase();
  }

  private initDatabase(): void {
    if (!this.storage.get(this.tasksKey)) {
      this.storage.update(this.tasksKey, []);
    }
    if (!this.storage.get(this.fileActivitiesKey)) {
      this.storage.update(this.fileActivitiesKey, []);
    }
    if (!this.storage.get(this.configKey)) {
      this.storage.update(this.configKey, {});
    }
  }

  saveTask(task: Task, synced: boolean = false): void {
    const tasks = this.storage.get<any[]>(this.tasksKey, []);
    const index = tasks.findIndex((t: any) => t.id === task.id);
    
    const taskWithSync = { ...task, _synced: synced };
    
    if (index >= 0) {
      tasks[index] = taskWithSync;
    } else {
      tasks.push(taskWithSync);
    }
    
    this.storage.update(this.tasksKey, tasks);
  }

  getTasks(): Task[] {
    const tasks = this.storage.get<any[]>(this.tasksKey, []);
    return tasks.map((task: any) => {
      const { _synced, ...taskData } = task;
      return taskData as Task;
    });
  }

  getTask(id: number): Task | undefined {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id);
  }

  deleteTask(id: number): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    this.storage.update(this.tasksKey, filtered);
  }

  getUnsyncedTasks(): Task[] {
    const tasks = this.storage.get<any[]>(this.tasksKey, []);
    return tasks
      .filter((t: any) => !t._synced)
      .map((task: any) => {
        const { _synced, ...taskData } = task;
        return taskData as Task;
      });
  }

  markTaskSynced(id: number): void {
    const tasks = this.storage.get<any[]>(this.tasksKey, []);
    const index = tasks.findIndex(t => t.id === id);
    if (index >= 0) {
      tasks[index]._synced = true;
      this.storage.update(this.tasksKey, tasks);
    }
  }

  saveFileActivity(activity: FileActivity, synced: boolean = false): void {
    const activities = this.getFileActivities();
    const index = activities.findIndex(a => a.file_path === activity.file_path);
    
    const activityWithSync = {
      ...activity,
      _synced: synced,
      created_at: activity.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (index >= 0) {
      activities[index] = activityWithSync;
    } else {
      activities.push(activityWithSync);
    }
    
    this.storage.update(this.fileActivitiesKey, activities);
  }

  getFileActivities(): FileActivity[] {
    const activities = this.storage.get<any[]>(this.fileActivitiesKey, []);
    return activities.map((activity: any) => {
      const { _synced, ...activityData } = activity;
      return activityData as FileActivity;
    });
  }

  getUnsyncedFileActivities(): FileActivity[] {
    const activities = this.storage.get<any[]>(this.fileActivitiesKey, []);
    return activities
      .filter((a: any) => !a._synced)
      .map((activity: any) => {
        const { _synced, ...activityData } = activity;
        return activityData as FileActivity;
      });
  }

  markFileActivitySynced(filePath: string): void {
    const activities = this.storage.get<any[]>(this.fileActivitiesKey, []);
    const index = activities.findIndex(a => a.file_path === filePath);
    if (index >= 0) {
      activities[index]._synced = true;
      activities[index].last_synced = new Date().toISOString();
      this.storage.update(this.fileActivitiesKey, activities);
    }
  }

  setConfig(key: string, value: string): void {
    const config = this.storage.get<Record<string, string>>(this.configKey, {});
    config[key] = value;
    this.storage.update(this.configKey, config);
  }

  getConfig(key: string): string | undefined {
    const config = this.storage.get<Record<string, string>>(this.configKey, {});
    return config[key];
  }

  close(): void {
  }
}
