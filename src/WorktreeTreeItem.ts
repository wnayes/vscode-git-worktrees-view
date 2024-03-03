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
    const resolvedWorktreePath = getResolvedPath(worktree.path);
    this.description = resolvedWorktreePath;
    this.command = command;
    this.tooltip = new vscode.MarkdownString("", true);
    if (worktree.branch) {
      this.tooltip.appendMarkdown(`$(git-branch) ${worktree.branch}\n\n`);
    }
    if (worktree.description) {
      this.tooltip.appendText(`${worktree.description}\n\n`);
    }
    if (resolvedWorktreePath) {
      this.tooltip.appendText(`${resolvedWorktreePath}\n\n`);
    }
    this.tooltip.appendText("Click to open worktree in current window");

    const currentPath = getWorkspaceDirectory() ?? "";
    const isWorkspaceWorktree =
      resolvedWorktreePath === getResolvedPath(currentPath);
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
