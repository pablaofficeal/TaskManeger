import * as vscode from 'vscode';
import { Task } from './types';

export class TaskManagerWebview {
  private panel: vscode.WebviewPanel | undefined;
  private sidebarView: vscode.WebviewView | undefined;
  private context: vscode.ExtensionContext;
  private messageHandlers: Map<string, (data: any) => Promise<any>> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  createPanel(): vscode.WebviewPanel {
    if (this.panel) {
      this.panel.reveal();
      return this.panel;
    }

    this.panel = vscode.window.createWebviewPanel(
      'taskManager',
      'Task Manager',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true
      }
    );

    this.panel.webview.html = this.getWebviewContent();
    
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage(async (message: any) => {
      const handler = this.messageHandlers.get(message.command);
      if (handler) {
        try {
          const result = await handler(message.data || {});
          this.panel?.webview.postMessage({
            command: message.command,
            success: true,
            data: result
          });
        } catch (error: any) {
          this.panel?.webview.postMessage({
            command: message.command,
            success: false,
            error: error.message
          });
        }
      }
    });

    return this.panel;
  }

  onMessage(command: string, handler: (data: any) => Promise<any>): void {
    this.messageHandlers.set(command, handler);
  }

  sendMessage(command: string, data: any): void {
    this.panel?.webview.postMessage({ command, data });
    this.sidebarView?.webview.postMessage({ command, data });
  }

  createSidebarView(webviewView: vscode.WebviewView): void {
    this.sidebarView = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true
    };

    webviewView.webview.html = this.getWebviewContent();
    
    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      const handler = this.messageHandlers.get(message.command);
      if (handler) {
        try {
          const result = await handler(message.data || {});
          webviewView.webview.postMessage({
            command: message.command,
            success: true,
            data: result
          });
        } catch (error: any) {
          webviewView.webview.postMessage({
            command: message.command,
            success: false,
            error: error.message
          });
        }
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        webviewView.webview.postMessage({
          command: 'loadTasks',
          data: []
        });
      }
    });
    if (webviewView.visible) {
      webviewView.webview.postMessage({
        command: 'loadTasks',
        data: []
      });
    }
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Manager</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
    :root {
        --primary: #8B5CF6;
        --primary-dark: #7C3AED;
        --primary-light: #A78BFA;
        --success: #10B981;
        --danger: #EF4444;
        --warning: #F59E0B;
        --info: #3B82F6;
        --dark: #1F2937;
        --darker: #111827;
        --light: #E5E7EB;
        --lighter: #F9FAFB;
        --border: #374151;
        --shadow: rgba(0, 0, 0, 0.25);
        --radius: 16px;
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        --glow: 0 0 20px rgba(139, 92, 246, 0.3);
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, var(--darker) 0%, #000 100%);
        min-height: 100vh;
        padding: 20px;
        color: var(--lighter);
        overflow-x: hidden;
    }

    .container {
        max-width: 1400px;
        margin: 0 auto;
        animation: fadeIn 0.6s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .header {
        background: rgba(31, 41, 55, 0.8);
        backdrop-filter: blur(20px);
        border-radius: var(--radius);
        padding: 28px 32px;
        margin-bottom: 30px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid rgba(139, 92, 246, 0.2);
        position: sticky;
        top: 20px;
        z-index: 100;
        transition: var(--transition);
        background: linear-gradient(135deg, 
            rgba(31, 41, 55, 0.9) 0%,
            rgba(17, 24, 39, 0.9) 100%);
    }

    .header:hover {
        box-shadow: var(--glow);
        border-color: rgba(139, 92, 246, 0.4);
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 24px;
    }

    .logo {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--primary), #EC4899);
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 28px;
        box-shadow: var(--glow);
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(139, 92, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
    }

    .header h1 {
        font-size: 36px;
        font-weight: 800;
        background: linear-gradient(135deg, var(--primary-light), #EC4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        letter-spacing: -0.5px;
    }

    .header-subtitle {
        color: var(--primary-light);
        font-size: 15px;
        margin-top: 6px;
        opacity: 0.9;
        font-weight: 500;
    }

    .stats {
        display: flex;
        gap: 20px;
        margin-left: auto;
    }

    .stat-item {
        text-align: center;
        padding: 16px 24px;
        background: rgba(31, 41, 55, 0.6);
        border-radius: 12px;
        border: 1px solid rgba(139, 92, 246, 0.1);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        min-width: 120px;
        transition: var(--transition);
    }

    .stat-item:hover {
        transform: translateY(-3px);
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.3);
    }

    .stat-number {
        font-size: 32px;
        font-weight: 800;
        color: var(--primary);
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 12px;
        color: #9CA3AF;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        font-weight: 600;
    }

    /* Buttons */
    .btn {
        padding: 14px 28px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        transition: var(--transition);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        position: relative;
        overflow: hidden;
    }

    .btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: 0.5s;
    }

    .btn:hover::before {
        left: 100%;
    }

    .btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }

    .btn:active {
        transform: translateY(-1px);
    }

    .btn-primary {
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        color: white;
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
    }

    .btn-success {
        background: linear-gradient(135deg, var(--success), #059669);
        color: white;
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
    }

    .btn-danger {
        background: linear-gradient(135deg, var(--danger), #DC2626);
        color: white;
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }

    .btn-warning {
        background: linear-gradient(135deg, var(--warning), #D97706);
        color: var(--darker);
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
    }

    .btn-info {
        background: linear-gradient(135deg, var(--info), #2563EB);
        color: white;
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-light {
        background: rgba(255, 255, 255, 0.1);
        color: var(--light);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
    }

    .btn-light:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-icon {
        padding: 12px;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    /* Form */
    .task-form {
        background: rgba(31, 41, 55, 0.8);
        backdrop-filter: blur(20px);
        border-radius: var(--radius);
        padding: 32px;
        margin-bottom: 30px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.2);
        animation: slideDown 0.5s ease-out;
        position: relative;
        overflow: hidden;
    }

    .task-form::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--primary), var(--info), var(--success));
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
        padding-bottom: 18px;
        border-bottom: 2px solid rgba(139, 92, 246, 0.2);
    }

    .form-header h2 {
        font-size: 26px;
        font-weight: 700;
        color: var(--lighter);
        position: relative;
        padding-left: 20px;
    }

    .form-header h2::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        background: var(--primary);
        border-radius: 50%;
    }

    .form-group {
        position: relative;
        margin-bottom: 24px;
    }

    .form-group label {
        display: block;
        margin-bottom: 10px;
        font-weight: 600;
        color: var(--primary-light);
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .form-control {
        width: 100%;
        padding: 16px 20px;
        border: 2px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        font-size: 15px;
        transition: var(--transition);
        background: rgba(17, 24, 39, 0.7);
        color: var(--lighter);
        font-family: inherit;
    }

    .form-control:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        background: rgba(17, 24, 39, 0.9);
    }

    .form-control::placeholder {
        color: #6B7280;
    }

    textarea.form-control {
        min-height: 120px;
        resize: vertical;
        line-height: 1.6;
    }

    .form-actions {
        display: flex;
        gap: 16px;
        justify-content: flex-end;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Filters */
    .filters {
        background: rgba(31, 41, 55, 0.8);
        backdrop-filter: blur(20px);
        border-radius: var(--radius);
        padding: 24px;
        margin-bottom: 30px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(139, 92, 246, 0.1);
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: center;
    }

    .filter-group {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .filter-label {
        color: var(--primary-light);
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .filter-badge {
        padding: 10px 20px;
        background: rgba(17, 24, 39, 0.6);
        border-radius: 50px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
        border: 2px solid transparent;
        color: var(--light);
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    .filter-badge:hover {
        background: rgba(139, 92, 246, 0.2);
        color: var(--primary-light);
        border-color: rgba(139, 92, 246, 0.3);
    }

    .filter-badge.active {
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        color: white;
        border-color: var(--primary);
        box-shadow: 0 5px 15px rgba(139, 92, 246, 0.3);
    }

    .search-box input {
        background: rgba(17, 24, 39, 0.7);
        border: 2px solid rgba(139, 92, 246, 0.2);
        border-radius: 50px;
        padding: 14px 24px;
        width: 280px;
        color: var(--lighter);
        font-size: 14px;
        transition: var(--transition);
    }

    .search-box input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        width: 320px;
    }

    /* Tasks Grid */
    .tasks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 30px;
    }

    .task-card {
        background: linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9));
        backdrop-filter: blur(20px);
        border-radius: var(--radius);
        padding: 28px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(139, 92, 246, 0.15);
        transition: var(--transition);
        position: relative;
        overflow: hidden;
    }

    .task-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 8px;
        height: 100%;
        background: linear-gradient(to bottom, var(--primary), var(--info));
        opacity: 0.8;
    }

    .task-card.high::before { 
        background: linear-gradient(to bottom, var(--danger), #DC2626);
        opacity: 1;
    }
    .task-card.medium::before { 
        background: linear-gradient(to bottom, var(--warning), #D97706);
        opacity: 1;
    }
    .task-card.low::before { 
        background: linear-gradient(to bottom, var(--success), #059669);
        opacity: 1;
    }

    .task-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35);
        border-color: rgba(139, 92, 246, 0.4);
    }

    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        position: relative;
    }

    .task-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--lighter);
        margin-bottom: 12px;
        line-height: 1.4;
        padding-right: 40px;
    }

    .task-description {
        color: #9CA3AF;
        font-size: 15px;
        line-height: 1.7;
        margin-bottom: 24px;
        white-space: pre-wrap;
        padding-right: 20px;
    }

    .task-meta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 24px;
    }

    .badge {
        padding: 10px 18px;
        border-radius: 50px;
        font-size: 13px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .badge-status {
        background: rgba(255, 255, 255, 0.08);
        color: var(--light);
    }

    .badge-status.todo { 
        background: rgba(107, 114, 128, 0.3);
        color: #9CA3AF;
    }
    .badge-status.in_progress { 
        background: rgba(59, 130, 246, 0.2);
        color: #60A5FA;
        border-color: rgba(59, 130, 246, 0.3);
    }
    .badge-status.done { 
        background: rgba(16, 185, 129, 0.2);
        color: #34D399;
        border-color: rgba(16, 185, 129, 0.3);
    }
    .badge-status.archived { 
        background: rgba(107, 114, 128, 0.3);
        color: #9CA3AF;
        border-color: rgba(107, 114, 128, 0.3);
    }

    .badge-priority {
        background: rgba(255, 255, 255, 0.08);
        color: var(--light);
    }

    .badge-priority.low { 
        background: rgba(16, 185, 129, 0.2);
        color: #34D399;
        border-color: rgba(16, 185, 129, 0.3);
    }
    .badge-priority.medium { 
        background: rgba(245, 158, 11, 0.2);
        color: #FBBF24;
        border-color: rgba(245, 158, 11, 0.3);
    }
    .badge-priority.high { 
        background: rgba(239, 68, 68, 0.2);
        color: #F87171;
        border-color: rgba(239, 68, 68, 0.3);
    }

    .task-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .task-actions button {
        flex: 1;
        padding: 14px;
        font-size: 13px;
        border-radius: 10px;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 80px 40px;
        grid-column: 1 / -1;
        background: linear-gradient(135deg, rgba(31, 41, 55, 0.4), rgba(17, 24, 39, 0.6));
        backdrop-filter: blur(20px);
        border-radius: var(--radius);
        border: 2px dashed rgba(139, 92, 246, 0.3);
    }

    .empty-icon {
        font-size: 72px;
        color: rgba(139, 92, 246, 0.4);
        margin-bottom: 24px;
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    .empty-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--primary-light);
        margin-bottom: 12px;
    }

    .empty-description {
        color: #9CA3AF;
        font-size: 16px;
        margin-bottom: 32px;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
        line-height: 1.6;
    }

    /* Loading */
    .loading {
        text-align: center;
        padding: 80px 40px;
        grid-column: 1 / -1;
    }

    .spinner {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(139, 92, 246, 0.1);
        border-top: 4px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 24px;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
    }

    .loading div {
        color: var(--primary-light);
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 1px;
    }

    /* Toast */
    .toast {
        position: fixed;
        bottom: 40px;
        right: 40px;
        padding: 20px 28px;
        background: rgba(31, 41, 55, 0.95);
        backdrop-filter: blur(20px);
        color: white;
        border-radius: 16px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        gap: 16px;
        transform: translateX(400px);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), 
                    opacity 0.5s ease;
        z-index: 1000;
        border: 1px solid rgba(139, 92, 246, 0.3);
        max-width: 400px;
    }

    .toast.show {
        transform: translateX(0);
        opacity: 1;
    }

    .toast.success { 
        background: rgba(16, 185, 129, 0.95);
        border-color: rgba(16, 185, 129, 0.5);
    }
    .toast.error { 
        background: rgba(239, 68, 68, 0.95);
        border-color: rgba(239, 68, 68, 0.5);
    }
    .toast.info { 
        background: rgba(59, 130, 246, 0.95);
        border-color: rgba(59, 130, 246, 0.5);
    }

    .toast i {
        font-size: 22px;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
        width: 10px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.3);
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, var(--primary), var(--primary-dark));
        border-radius: 10px;
        border: 2px solid rgba(31, 41, 55, 0.8);
    }

    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, var(--primary-dark), var(--primary));
    }

    /* Responsive */
    @media (max-width: 1200px) {
        .tasks-grid {
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        }
        
        .header {
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .stats {
            order: 3;
            width: 100%;
            justify-content: center;
        }
        
        .header-actions {
            margin-left: auto;
        }
    }

    @media (max-width: 768px) {
        .container {
            padding: 10px;
        }
        
        .header {
            padding: 20px;
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
        }
        
        .header-content {
            flex-direction: column;
            text-align: center;
            gap: 15px;
        }
        
        .header-actions {
            width: 100%;
            display: flex;
            justify-content: center;
        }
        
        .stats {
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .stat-item {
            min-width: calc(33.333% - 20px);
            flex: 1;
        }
        
        .tasks-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .filters {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
        }
        
        .filter-group {
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .search-box input {
            width: 100%;
        }
        
        .search-box input:focus {
            width: 100%;
        }
        
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .toast {
            left: 20px;
            right: 20px;
            bottom: 20px;
            max-width: none;
        }
    }

    @media (max-width: 480px) {
        .stat-item {
            min-width: calc(50% - 10px);
        }
        
        .form-actions {
            flex-direction: column;
        }
        
        .task-actions {
            flex-direction: column;
        }
        
        .btn {
            padding: 12px 20px;
        }
    }

    /* Glass effect for all containers */
    .header,
    .task-form,
    .filters,
    .task-card,
    .empty-state,
    .toast {
        background: linear-gradient(
            135deg,
            rgba(31, 41, 55, 0.7) 0%,
            rgba(17, 24, 39, 0.9) 100%
        );
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Gradient text effects */
    .gradient-text {
        background: linear-gradient(135deg, var(--primary), var(--info), var(--success));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Hover effects */
    .hover-glow:hover {
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
    }

    /* Focus states */
    *:focus {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
    }

    /* Selection */
    ::selection {
        background: rgba(139, 92, 246, 0.3);
        color: white;
    }

    /* Smooth transitions */
    .smooth-transition {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Card hover effect */
    .card-hover {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .card-hover:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
</style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="logo">
                    <i class="fas fa-tasks"></i>
                </div>
                <div>
                    <h1>Task Manager</h1>
                    <div class="header-subtitle">Управляйте задачами эффективно</div>
                </div>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number" id="totalTasks">0</div>
                    <div class="stat-label">Всего</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="activeTasks">0</div>
                    <div class="stat-label">Активных</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="doneTasks">0</div>
                    <div class="stat-label">Выполнено</div>
                </div>
            </div>

            <div class="header-actions">
                <button class="btn btn-info" onclick="syncTasks()">
                    <i class="fas fa-sync-alt"></i> Синхронизировать
                </button>
                <button class="btn btn-primary" onclick="toggleForm()">
                    <i class="fas fa-plus"></i> Новая задача
                </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-group">
                <span class="filter-label">Статус:</span>
                <span class="filter-badge active" onclick="filterTasks('all')">Все</span>
                <span class="filter-badge" onclick="filterTasks('todo')">К выполнению</span>
                <span class="filter-badge" onclick="filterTasks('in_progress')">В работе</span>
                <span class="filter-badge" onclick="filterTasks('done')">Выполнено</span>
                <span class="filter-badge" onclick="filterTasks('archived')">Архив</span>
            </div>
            <div class="filter-group">
                <span class="filter-label">Приоритет:</span>
                <span class="filter-badge" onclick="filterByPriority('all')">Все</span>
                <span class="filter-badge" onclick="filterByPriority('high')">Высокий</span>
                <span class="filter-badge" onclick="filterByPriority('medium')">Средний</span>
                <span class="filter-badge" onclick="filterByPriority('low')">Низкий</span>
            </div>
            <div class="search-box" style="margin-left: auto;">
                <input type="text" class="form-control" placeholder="Поиск задач..." 
                       oninput="searchTasks(this.value)" 
                       style="width: 250px; padding: 10px 15px;">
            </div>
        </div>

        <!-- Task Form -->
        <div id="taskForm" class="task-form hidden">
            <div class="form-header">
                <h2 id="formTitle">Создать задачу</h2>
                <button class="btn btn-light btn-icon" onclick="cancelForm()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-heading"></i> Название *</label>
                <input type="text" id="taskTitle" class="form-control" placeholder="Введите название задачи" required>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-align-left"></i> Описание</label>
                <textarea id="taskDescription" class="form-control" rows="4" placeholder="Опишите задачу..."></textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label><i class="fas fa-tasks"></i> Статус</label>
                    <select id="taskStatus" class="form-control">
                        <option value="todo">К выполнению</option>
                        <option value="in_progress">В работе</option>
                        <option value="done">Выполнено</option>
                        <option value="archived">Архив</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-flag"></i> Приоритет</label>
                    <select id="taskPriority" class="form-control">
                        <option value="low">Низкий</option>
                        <option value="medium" selected>Средний</option>
                        <option value="high">Высокий</option>
                    </select>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-light" onclick="cancelForm()">
                    <i class="fas fa-times"></i> Отмена
                </button>
                <button class="btn btn-primary" onclick="saveTask()">
                    <i class="fas fa-save"></i> Сохранить задачу
                </button>
            </div>
        </div>

        <!-- Tasks Grid -->
        <div id="tasksList" class="tasks-grid">
            <div class="loading">
                <div class="spinner"></div>
                <div>Загрузка задач...</div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="toast hidden">
        <i class="fas fa-info-circle"></i>
        <span id="toastMessage"></span>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let tasks = [];
        let editingTaskId = null;
        let currentFilter = 'all';
        let currentPriority = 'all';
        let currentSearch = '';

        // Toast system
        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            
            toast.className = \`toast \${type}\`;
            toastMessage.textContent = message;
            
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('show'), 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.classList.add('hidden'), 300);
            }, 3000);
        }

        // Task management
        function toggleForm() {
            const form = document.getElementById('taskForm');
            const title = document.getElementById('formTitle');
            
            if (form.classList.contains('hidden')) {
                editingTaskId = null;
                title.textContent = 'Создать задачу';
                form.classList.remove('hidden');
                
                // Reset form
                document.getElementById('taskTitle').value = '';
                document.getElementById('taskDescription').value = '';
                document.getElementById('taskStatus').value = 'todo';
                document.getElementById('taskPriority').value = 'medium';
            } else {
                form.classList.add('hidden');
            }
        }

        function cancelForm() {
            document.getElementById('taskForm').classList.add('hidden');
        }

        function saveTask() {
            const title = document.getElementById('taskTitle').value;
            if (!title.trim()) {
                showToast('Введите название задачи', 'error');
                return;
            }

            const task = {
                title: title.trim(),
                description: document.getElementById('taskDescription').value.trim(),
                status: document.getElementById('taskStatus').value,
                priority: document.getElementById('taskPriority').value
            };
            if (editingTaskId) {
                vscode.postMessage({
                    command: 'updateTask',
                    data: { id: editingTaskId, ...task }
                });
                showToast('Задача обновлена', 'success');
            } else {
                vscode.postMessage({
                    command: 'createTask',
                    data: task
                });
                showToast('Задача создана', 'success');
            }

            cancelForm();
        }

        function editTask(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            editingTaskId = id;
            document.getElementById('formTitle').textContent = 'Редактировать задачу';
            document.getElementById('taskTitle').value = task.title || '';
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskStatus').value = task.status || 'todo';
            document.getElementById('taskPriority').value = task.priority || 'medium';
            document.getElementById('taskForm').classList.remove('hidden');
        }

        function deleteTask(id) {
            if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
                vscode.postMessage({
                    command: 'deleteTask',
                    data: { id }
                });
                showToast('Задача удалена', 'success');
            }
        }

        function updateTaskStatus(id, status) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            vscode.postMessage({
                command: 'updateTask',
                data: { id, status }
            });
            
            const statusText = getStatusText(status);
            showToast(\`Задача переведена в статус "\${statusText}"\`, 'info');
        }

        // Filtering and searching
        function filterTasks(status) {
            currentFilter = status;
            document.querySelectorAll('.filter-badge').forEach(badge => {
                if (badge.textContent.includes('Все') && status === 'all') {
                    badge.classList.add('active');
                } else if (badge.textContent.includes(getStatusText(status))) {
                    badge.classList.add('active');
                } else {
                    badge.classList.remove('active');
                }
            });
            renderTasks();
        }

        function filterByPriority(priority) {
            currentPriority = priority;
            renderTasks();
        }

        function searchTasks(query) {
            currentSearch = query.toLowerCase();
            renderTasks();
        }

        // Rendering
        function renderTasks() {
            const container = document.getElementById('tasksList');
            
            // Filter tasks
            let filteredTasks = tasks.filter(task => {
                const matchesFilter = currentFilter === 'all' || task.status === currentFilter;
                const matchesPriority = currentPriority === 'all' || task.priority === currentPriority;
                const matchesSearch = currentSearch === '' || 
                    (task.title && task.title.toLowerCase().includes(currentSearch)) ||
                    (task.description && task.description.toLowerCase().includes(currentSearch));
                
                return matchesFilter && matchesPriority && matchesSearch;
            });

            // Update stats
            updateStats(filteredTasks);

            if (filteredTasks.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="empty-title">Нет задач</div>
                        <div class="empty-description">
                            \${currentSearch ? 'По вашему запросу ничего не найдено' : 
                              currentFilter !== 'all' ? 'Нет задач с выбранным фильтром' : 
                              'Создайте первую задачу!'}
                        </div>
                        \${!currentSearch && currentFilter === 'all' && currentPriority === 'all' ? 
                            '<button class="btn btn-primary" onclick="toggleForm()">Создать задачу</button>' : 
                            '<button class="btn btn-light" onclick="clearFilters()">Сбросить фильтры</button>'}
                    </div>
                \`;
                return;
            }

            container.innerHTML = filteredTasks.map(task => \`
                <div class="task-card \${task.priority}" data-id="\${task.id}">
                    <div class="task-header">
                        <div>
                            <div class="task-title">\${escapeHtml(task.title || 'Без названия')}</div>
                        </div>
                        <button class="btn btn-light btn-icon" onclick="editTask('\${task.id}')" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    
                    \${task.description ? \`
                        <div class="task-description">\${escapeHtml(task.description)}</div>
                    \` : ''}
                    
                    <div class="task-meta">
                        <span class="badge badge-status \${task.status || 'todo'}">
                            <i class="fas fa-circle" style="font-size: 8px;"></i>
                            \${getStatusText(task.status)}
                        </span>
                        <span class="badge badge-priority \${task.priority || 'medium'}">
                            <i class="fas fa-flag"></i>
                            \${getPriorityText(task.priority)}
                        </span>
                    </div>
                    
                    <div class="task-actions">
                        \${task.status !== 'done' ? 
                            \`<button class="btn btn-success" onclick="updateTaskStatus('\${task.id}', 'done')">
                                <i class="fas fa-check"></i> Завершить
                            </button>\` : 
                            \`<button class="btn btn-light" onclick="updateTaskStatus('\${task.id}', 'todo')">
                                <i class="fas fa-redo"></i> Открыть
                            </button>\`
                        }
                        \${task.status !== 'archived' ? 
                            \`<button class="btn btn-warning" onclick="updateTaskStatus('\${task.id}', 'archived')">
                                <i class="fas fa-archive"></i> Архив
                            </button>\` : ''
                        }
                        <button class="btn btn-danger" onclick="deleteTask('\${task.id}')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            \`).join('');
        }

        function updateStats(tasks) {
            const totalTasks = tasks.length;
            const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'archived').length;
            const doneTasks = tasks.filter(t => t.status === 'done').length;
            
            document.getElementById('totalTasks').textContent = totalTasks;
            document.getElementById('activeTasks').textContent = activeTasks;
            document.getElementById('doneTasks').textContent = doneTasks;
        }

        function clearFilters() {
            currentFilter = 'all';
            currentPriority = 'all';
            currentSearch = '';
            document.querySelectorAll('.filter-badge').forEach(badge => {
                if (badge.textContent === 'Все') {
                    badge.classList.add('active');
                } else {
                    badge.classList.remove('active');
                }
            });
            document.querySelector('.search-box input').value = '';
            renderTasks();
        }

        // Utility functions
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getStatusText(status) {
            const statuses = {
                'todo': 'К выполнению',
                'in_progress': 'В работе',
                'done': 'Выполнено',
                'archived': 'Архив'
            };
            return statuses[status] || status || 'К выполнению';
        }

        function getPriorityText(priority) {
            const priorities = {
                'low': 'Низкий',
                'medium': 'Средний',
                'high': 'Высокий'
            };
            return priorities[priority] || priority || 'Средний';
        }

        function syncTasks() {
            vscode.postMessage({ command: 'sync' });
            showToast('Синхронизация начата...', 'info');
        }

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'loadTasks') {
                tasks = message.data || [];
                renderTasks();
                if (tasks.length > 0) {
                    showToast(\`Загружено \${tasks.length} задач\`, 'success');
                }
            } else if (message.command === 'createTask' || message.command === 'updateTask' || message.command === 'deleteTask') {
                if (message.success) {
                    vscode.postMessage({ command: 'loadTasks' });
                } else {
                    showToast('Ошибка: ' + (message.error || 'Неизвестная ошибка'), 'error');
                }
            } else if (message.command === 'sync') {
                if (message.success) {
                    showToast(
                        \`Синхронизировано: \${message.data?.tasks || 0} задач\`,
                        'success'
                    );
                    vscode.postMessage({ command: 'loadTasks' });
                } else {
                    showToast('Ошибка синхронизации: ' + (message.error || 'Неизвестная ошибка'), 'error');
                }
            }
        });
        vscode.postMessage({ command: 'loadTasks' });
    </script>
</body>
</html>`;
  }
}