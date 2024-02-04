import * as vscode from "vscode";
import { WorktreeTreeItem } from "./WorktreeTreeItem";
import { exec } from "./exec";
import { parseWorktreePorcelain } from "./Worktrees";
import { WorktreeCommands } from "./WorktreeCommands";
import { getWorkspaceDirectory } from "./utils";

export class WorktreeProvider
  implements vscode.TreeDataProvider<WorktreeTreeItem>
{
  public worktrees: WorktreeTreeItem[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<
    WorktreeTreeItem | undefined | void
  > = new vscode.EventEmitter<WorktreeTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    WorktreeTreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async forceRemove(args: { path: string }) {
    vscode.window
      .showInformationMessage(
        `Are you sure you want to force remove this worktree?\n\n${args.path}\n\nThis is IRREVERSIBLE.`,
        "Yes",
        "No"
      )
      .then((answer) => {
        if (answer === "Yes") {
          this.removeWorktree(args, true);
        }
      });
  }

  async removeWorktree(args: { path: string }, force: boolean) {
    await exec(
      `git -C "${getWorkspaceDirectory()}" worktree remove${
        force ? " -f" : ""
      } "${args.path}"`
    );
  }

  getTreeItem(element: WorktreeTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: WorktreeTreeItem): Thenable<WorktreeTreeItem[]> {
    const workspaceRoot = getWorkspaceDirectory();
    if (workspaceRoot) {
      return Promise.resolve(
        getWorktreeTreeItems(workspaceRoot).then((worktrees) => {
          return (this.worktrees = worktrees);
        })
      );
    }
    return Promise.resolve([]);
  }
}

async function getWorktreeTreeItems(
  workingPath: string
): Promise<WorktreeTreeItem[]> {
  const worktreeOutput = await exec(
    `git -C "${workingPath}" worktree list --porcelain -z`
  );
  const worktrees = parseWorktreePorcelain(worktreeOutput);
  const treeItems = [];
  for (const worktree of worktrees) {
    if (worktree.bare) {
      continue;
    }

    const openCommand: vscode.Command = {
      title: "open",
      command: WorktreeCommands.Open,
      arguments: [worktree.path],
    };
    treeItems.push(
      new WorktreeTreeItem(
        worktree,
        vscode.TreeItemCollapsibleState.None,
        openCommand
      )
    );
  }
  return treeItems.sort((a, b) => {
    if (a.label! < b.label!) return -1;
    if (a.label! > b.label!) return 1;
    return 0;
  });
}
