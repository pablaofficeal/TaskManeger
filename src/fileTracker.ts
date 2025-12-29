import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LocalDatabase } from './database';
import { FileActivity } from './types';

export class FileTracker {
  private watcher: vscode.FileSystemWatcher | null = null;
  private db: LocalDatabase;
  private workspaceFolders: readonly vscode.WorkspaceFolder[] = [];

  constructor(db: LocalDatabase) {
    this.db = db;
  }

  start(workspaceFolders: readonly vscode.WorkspaceFolder[]): void {
    this.workspaceFolders = workspaceFolders;
    this.watcher = vscode.workspace.createFileSystemWatcher('**/*');
    
    this.watcher.onDidCreate((uri: vscode.Uri) => this.handleFileChange(uri, 'create'));
    this.watcher.onDidChange((uri: vscode.Uri) => this.handleFileChange(uri, 'change'));
    this.watcher.onDidDelete((uri: vscode.Uri) => this.handleFileDelete(uri));
    vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
      if (document.uri.scheme === 'file') {
        this.trackFile(document.uri);
      }
    });
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      if (document.uri.scheme === 'file') {
        this.trackFile(document.uri);
      }
    });
  }

  private async handleFileChange(uri: vscode.Uri, event: 'create' | 'change'): Promise<void> {
    if (uri.scheme !== 'file') return;
    await this.trackFile(uri);
  }

  private async handleFileDelete(uri: vscode.Uri): Promise<void> {
  }

  private async trackFile(uri: vscode.Uri): Promise<void> {
    try {
      const filePath = uri.fsPath;
      const stats = await fs.promises.stat(filePath);
      if (stats.isDirectory() || path.basename(filePath).startsWith('.')) {
        return;
      }
      if (filePath.includes('node_modules') || 
          filePath.includes('.git') || 
          filePath.includes('.vscode') ||
          filePath.includes('out') ||
          filePath.includes('dist')) {
        return;
      }

      const activity: FileActivity = {
        file_path: filePath,
        file_name: path.basename(filePath),
        file_size: stats.size,
        modified_at: stats.mtime.toISOString()
      };

      this.db.saveFileActivity(activity, false);
    } catch (error) {
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }
  }

  getTrackedFiles(): FileActivity[] {
    return this.db.getFileActivities();
  }
}

