import * as vscode from "vscode";

/** Represents an grouper of worktrees in the Worktrees view. */
export class GroupTreeItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = "worktree-grouper";
  }

  public childNodes: vscode.TreeItem[] = [];
}
