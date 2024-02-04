import * as vscode from "vscode";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

/** Gets the VS Code current workspace directory. */
export function getWorkspaceDirectory(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function getResolvedPath(path: string): string {
  try {
    return realpathSync(resolve(path));
  } catch {
    return path;
  }
}
