import * as vscode from "vscode";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

/** Gets the VS Code current workspace directory. */
export function getWorkspaceDirectory(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function getResolvedPath(path: string): string {
  try {
    path = realpathSync(resolve(path));

    // Sometimes the drive letter gets lowercased on Windows.
    if (path && path[0]) {
      path = path[0].toUpperCase() + path.substring(1);
    }
  } catch {}
  return path;
}
