import * as vscode from "vscode";
import { minimatch } from "minimatch";
import { WorktreeTreeItem } from "./WorktreeTreeItem";
import { exec } from "./exec";
import { parseWorktreePorcelain } from "./Worktrees";
import { WorktreeCommands } from "./WorktreeCommands";
import { getWorkspaceDirectory } from "./utils";
import { ConfigSectionName, Settings } from "./Settings";

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

  const { ignorePaths, ignoreBranches } = getIgnoreConfiguration();

  const treeItems = [];
  for (const worktree of worktrees) {
    if (worktree.bare) {
      continue;
    }
    let skip = false;
    for (const ignorePath of ignorePaths) {
      if (worktree.path && minimatch(worktree.path, ignorePath)) {
        skip = true;
        break;
      }
    }
    for (const ignoreBranch of ignoreBranches) {
      if (worktree.branch && minimatch(worktree.branch, ignoreBranch)) {
        skip = true;
        break;
      }
    }
    if (skip) {
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

function getIgnoreConfiguration() {
  let ignorePaths = [];
  let ignoreBranches = [];
  const settings = vscode.workspace.getConfiguration(ConfigSectionName);
  const ignorePathsRaw = settings.get(Settings.IgnorePaths);
  if (Array.isArray(ignorePathsRaw)) {
    ignorePaths = ignorePathsRaw;
  }
  const ignoreBranchesRaw = settings.get(Settings.IgnoreBranches);
  if (Array.isArray(ignoreBranchesRaw)) {
    ignoreBranches = ignoreBranchesRaw;
  }
  return { ignorePaths, ignoreBranches };
}
