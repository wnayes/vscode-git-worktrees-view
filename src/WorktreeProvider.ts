import * as vscode from "vscode";
import { minimatch } from "minimatch";
import { WorktreeTreeItem } from "./WorktreeTreeItem";
import { exec, execShellCommandAsTask } from "./exec";
import { parseWorktreePorcelain } from "./Worktrees";
import { WorktreeCommands } from "./WorktreeCommands";
import { getWorkspaceDirectory } from "./utils";
import { ConfigSectionName, Settings } from "./Settings";
import { GroupTreeItem } from "./GroupTreeItem";

export class WorktreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    WorktreeTreeItem | undefined | void
  > = new vscode.EventEmitter<WorktreeTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    WorktreeTreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async forceRemove(path: string) {
    vscode.window
      .showInformationMessage(
        `Are you sure you want to force remove this worktree?\n\n${path}\n\nThis is IRREVERSIBLE.`,
        "Yes",
        "No"
      )
      .then((answer) => {
        if (answer === "Yes") {
          this.removeWorktree(path, true);
        }
      });
  }

  async removeWorktree(path: string, force: boolean) {
    const removeCommand = `git -C "${getWorkspaceDirectory()}" worktree remove${
      force ? " -f" : ""
    } "${path}"`;
    execShellCommandAsTask(removeCommand, "Remove Worktree");
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (element instanceof GroupTreeItem) {
      return Promise.resolve(element.childNodes);
    }

    const workspaceRoot = getWorkspaceDirectory();
    if (workspaceRoot) {
      return Promise.resolve(getWorktreeTreeItems(workspaceRoot));
    }
    return Promise.resolve([]);
  }
}

async function getWorktreeTreeItems(
  workingPath: string
): Promise<vscode.TreeItem[]> {
  const worktreeOutput = await exec(
    `git -C "${workingPath}" worktree list --porcelain -z`
  );
  const worktrees = parseWorktreePorcelain(worktreeOutput);

  const { ignorePaths, ignoreBranches, pathNodeParentMap } =
    getPathsConfiguration();

  const treeItems: vscode.TreeItem[] = [];
  const nodeMap = new Map<string, GroupTreeItem>();
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
    const worktreeTreeItem = new WorktreeTreeItem(
      worktree,
      vscode.TreeItemCollapsibleState.None,
      openCommand
    );

    let foundParent = false;
    for (const mapping of pathNodeParentMap) {
      if (worktree.path && minimatch(worktree.path, mapping.pathPattern)) {
        let parentNode = nodeMap.get(mapping.parent);
        if (!parentNode) {
          parentNode = new GroupTreeItem(mapping.parent);
          nodeMap.set(mapping.parent, parentNode);
          treeItems.push(parentNode);
        }
        parentNode.childNodes.push(worktreeTreeItem);
        foundParent = true;
      }
    }

    if (!foundParent) {
      treeItems.push(worktreeTreeItem);
    }
  }
  return treeItems.sort((a, b) => {
    if (a.label! < b.label!) return -1;
    if (a.label! > b.label!) return 1;
    return 0;
  });
}

function getPathsConfiguration() {
  let ignorePaths = [];
  let ignoreBranches = [];
  let pathNodeParentMap: { pathPattern: string; parent: string }[] = [];
  const settings = vscode.workspace.getConfiguration(ConfigSectionName);
  const ignorePathsRaw = settings.get(Settings.IgnorePaths);
  if (Array.isArray(ignorePathsRaw)) {
    ignorePaths = ignorePathsRaw;
  }
  const ignoreBranchesRaw = settings.get(Settings.IgnoreBranches);
  if (Array.isArray(ignoreBranchesRaw)) {
    ignoreBranches = ignoreBranchesRaw;
  }
  const pathNodeParentMapRaw = settings.get(Settings.PathNodeParentMap);
  if (Array.isArray(pathNodeParentMapRaw)) {
    pathNodeParentMap = pathNodeParentMapRaw;
  }
  return { ignorePaths, ignoreBranches, pathNodeParentMap };
}
