import * as vscode from "vscode";
import { IWorktree } from "./Worktrees";
import { getResolvedPath, getWorkspaceDirectory } from "./utils";

/** Represents an individual item in the Worktrees view. */
export class WorktreeTreeItem extends vscode.TreeItem {
  constructor(
    worktree: IWorktree,
    collapsibleState: vscode.TreeItemCollapsibleState,
    command?: vscode.Command
  ) {
    super(getBranchNameForDisplay(worktree.branch), collapsibleState);
    this.worktree = worktree;
    this.description = worktree.path;
    this.tooltip = new vscode.MarkdownString(
      `$(git-branch) ${worktree.branch}

${worktree.path}

Click to open worktree in current window`,
      true
    );
    this.command = command;

    const currentPath = getWorkspaceDirectory() ?? "";
    const isWorkspaceWorktree =
      getResolvedPath(this.worktree.path) === getResolvedPath(currentPath);
    if (isWorkspaceWorktree) {
      this.contextValue = "current-worktree";
      this.iconPath = new vscode.ThemeIcon("check");
    } else {
      this.contextValue = "other-worktree";
      if (this.worktree.detached) {
        this.iconPath = new vscode.ThemeIcon("git-commit");
      } else {
        this.iconPath = new vscode.ThemeIcon("git-branch");
      }
    }
  }

  public worktree: IWorktree;
}

function getBranchNameForDisplay(branch: string): string {
  if (branch.startsWith("refs/heads/")) {
    return branch.substring("refs/heads/".length);
  }
  return branch;
}
