import * as vscode from "vscode";
import { IWorktree } from "./Worktrees";
import { getResolvedPath, getWorkspaceDirectory } from "./utils";

/** Represents an individual item in the Worktrees view. */
export class WorktreeTreeItem extends vscode.TreeItem {
  public worktree: IWorktree;
  private _resolvedWorktreePath: string;

  constructor(
    worktree: IWorktree,
    collapsibleState: vscode.TreeItemCollapsibleState,
    command?: vscode.Command
  ) {
    super(getBranchNameForDisplay(worktree.branch), collapsibleState);
    this.worktree = worktree;
    this._resolvedWorktreePath = getResolvedPath(worktree.path);
    this.description = this._resolvedWorktreePath;
    this.command = command;
    this.rebuildTooltip();

    const currentPath = getWorkspaceDirectory() ?? "";
    const isWorkspaceWorktree =
      this._resolvedWorktreePath === getResolvedPath(currentPath);
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

  rebuildTooltip(): void {
    this.tooltip = new vscode.MarkdownString("", true);
    if (this.worktree.branch) {
      this.tooltip.appendMarkdown(`$(git-branch) ${this.worktree.branch}\n\n`);
    }
    if (this.worktree.description) {
      this.tooltip.appendText(`${this.worktree.description}\n\n`);
    }
    if (this._resolvedWorktreePath) {
      this.tooltip.appendText(`${this._resolvedWorktreePath}\n\n`);
    }
    this.tooltip.appendText("Click to open worktree in current window");
  }
}

function getBranchNameForDisplay(branch: string): string {
  if (branch.startsWith("refs/heads/")) {
    return branch.substring("refs/heads/".length);
  }
  return branch;
}
