import * as vscode from 'vscode';
import { LocalDatabase } from './database';
import { ApiClient } from './apiClient';
import { FileTracker } from './fileTracker';
import { SyncManager } from './syncManager';
import { TaskManagerWebview } from './webview';
import { Task } from './types';

let db: LocalDatabase;
let api: ApiClient;
let fileTracker: FileTracker;
let syncManager: SyncManager;
let webview: TaskManagerWebview;

function setupMessageHandlers() {
  webview.onMessage('loadTasks', async () => {
    const tasks = db.getTasks();
    webview.sendMessage('loadTasks', tasks);
    return tasks;
  });

  webview.onMessage('createTask', async (data: Partial<Task>) => {
    try {
      if (syncManager.isConnected()) {
        const task = await api.createTask(data);
        db.saveTask(task, true);
        return task;
      } else {
        const localTask: Task = {
          id: Date.now(),
          user_id: 0,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.saveTask(localTask, false);
        return localTask;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка создания задачи');
    }
  });

  webview.onMessage('updateTask', async (data: { id: number } & Partial<Task>) => {
    try {
      if (syncManager.isConnected()) {
        const task = await api.updateTask(data.id, data);
        db.saveTask(task, true);
        return task;
      } else {
        const existingTask = db.getTask(data.id);
        if (existingTask) {
          const updatedTask: Task = {
            ...existingTask,
            ...data,
            updated_at: new Date().toISOString()
          };
          db.saveTask(updatedTask, false);
          return updatedTask;
        }
        throw new Error('Задача не найдена');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка обновления задачи');
    }
  });

  webview.onMessage('deleteTask', async (data: { id: number }) => {
    try {
      if (syncManager.isConnected()) {
        await api.deleteTask(data.id);
      }
      db.deleteTask(data.id);
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка удаления задачи');
    }
  });

  webview.onMessage('sync', async () => {
    const result = await syncManager.sync();
    webview.sendMessage('loadTasks', db.getTasks());
    return result;
  });
}

export function activate(context: vscode.ExtensionContext) {
  const openPanelCommand = vscode.commands.registerCommand('tmOpenPanel', async () => {
    try {
      if (!webview) {
        vscode.window.showErrorMessage('TaskManager is not initialized yet. Please wait a moment and try again.');
        return;
      }
      const panel = webview.createPanel();
      panel.webview.postMessage({
        command: 'loadTasks',
        data: db.getTasks()
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error opening TaskManager: ${error.message || error}`);
    }
  });

  const syncCommand = vscode.commands.registerCommand('tmSync', async () => {
    try {
      if (!syncManager) {
        vscode.window.showErrorMessage('TaskManager is not initialized yet. Please wait a moment and try again.');
        return;
      }
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Синхронизация с сервером...',
        cancellable: false
      }, async (_progress) => {
        const result = await syncManager.sync();
        if (result.error) {
          vscode.window.showErrorMessage(`Ошибка синхронизации: ${result.error}`);
        } else {
          vscode.window.showInformationMessage(
            `Синхронизировано: ${result.tasks} задач, ${result.files} файлов`
          );
        }
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error syncing: ${error.message || error}`);
    }
  });

  const loginCommand = vscode.commands.registerCommand('tmLogin', async () => {
    try {
      if (!api) {
        vscode.window.showErrorMessage('TaskManager is not initialized yet. Please wait a moment and try again.');
        return;
      }
      const email = await vscode.window.showInputBox({
        prompt: 'Enter email',
        placeHolder: 'user@example.com'
      });

      if (!email) return;

      const password = await vscode.window.showInputBox({
        prompt: 'Enter password',
        password: true
      });

      if (!password) return;

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Logging in...',
        cancellable: false
      }, async () => {
        const response = await api.login(email, password);
        db.setConfig('token', response.token);
        vscode.window.showInformationMessage(`Welcome, ${response.user.name}!`);
        await syncManager.sync();
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(`Login error: ${error.message || 'Invalid email or password'}`);
    }
  });

  const registerCommand = vscode.commands.registerCommand('tmRegister', async () => {
    try {
      if (!api) {
        vscode.window.showErrorMessage('TaskManager is not initialized yet. Please wait a moment and try again.');
        return;
      }
      const name = await vscode.window.showInputBox({
        prompt: 'Enter your name',
        placeHolder: 'John Doe'
      });

      if (!name) return;

      const email = await vscode.window.showInputBox({
        prompt: 'Enter email',
        placeHolder: 'user@example.com'
      });

      if (!email) return;

      const password = await vscode.window.showInputBox({
        prompt: 'Enter password',
        password: true
      });

      if (!password) return;

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Registering...',
        cancellable: false
      }, async () => {
        const response = await api.register(email, password, name);
        db.setConfig('token', response.token);
        vscode.window.showInformationMessage(`Welcome, ${response.user.name}! Registration successful.`);
        await syncManager.sync();
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(`Registration error: ${error.message || 'Registration failed'}`);
    }
  });

  context.subscriptions.push(openPanelCommand);
  context.subscriptions.push(syncCommand);
  context.subscriptions.push(loginCommand);
  context.subscriptions.push(registerCommand);
  try {
    db = new LocalDatabase(context);
    let apiUrl = vscode.workspace.getConfiguration('taskmanager').get<string>('apiUrl', 'https://hjmvhbdp-8080.euw.devtunnels.ms');
    if (apiUrl.endsWith('/api')) {
      apiUrl = apiUrl.slice(0, -4);
    }
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    api = new ApiClient(apiUrl);
    const savedToken = db.getConfig('token');
    if (savedToken) {
      api.setToken(savedToken);
    }

    fileTracker = new FileTracker(db);
    syncManager = new SyncManager(db, api);
    webview = new TaskManagerWebview(context);
    setupMessageHandlers();
    const sidebarProvider = vscode.window.registerWebviewViewProvider(
      'taskmanagerSidebar',
      {
        resolveWebviewView: (webviewView: vscode.WebviewView) => {
          webview.createSidebarView(webviewView);
        }
      }
    );
    context.subscriptions.push(sidebarProvider);
    if (vscode.workspace.workspaceFolders) {
      fileTracker.start(vscode.workspace.workspaceFolders);
    }
    syncManager.startAutoSync(5);
  } catch (error: any) {
    vscode.window.showErrorMessage(`TaskManager initialization error: ${error.message || error}`);
  }
}

export function deactivate() {
  if (fileTracker) {
    fileTracker.stop();
  }
  if (syncManager) {
    syncManager.stopAutoSync();
  }
  if (db) {
    db.close();
  }
}

