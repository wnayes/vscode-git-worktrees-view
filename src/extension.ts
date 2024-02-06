import * as vscode from "vscode";
import { API as GitAPI, GitExtension } from "./git.d";
import { WorktreeProvider } from "./WorktreeProvider";
import { WorktreeCommands } from "./WorktreeCommands";
import { WorktreeTreeItem } from "./WorktreeTreeItem";
import { revealFile } from "./exec";

export function activate(context: vscode.ExtensionContext) {
  const worktreeProvider = new WorktreeProvider();
  vscode.window.registerTreeDataProvider(
    "git-worktrees-view",
    worktreeProvider
  );

  subscribeToGitRepoChanges(worktreeProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WorktreeCommands.Open,
      async (path: string) => {
        const uri = vscode.Uri.file(path);
        await vscode.commands.executeCommand("vscode.openFolder", uri);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WorktreeCommands.OpenNewWindow,
      async (args: WorktreeTreeItem) => {
        const path = args.worktree.path;
        if (path) {
          const uri = vscode.Uri.file(path);
          await vscode.commands.executeCommand("vscode.openFolder", uri, true);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WorktreeCommands.OpenFileExplorer,
      async (args: WorktreeTreeItem) => {
        const path = args.worktree.path;
        if (path) {
          const uri = vscode.Uri.file(path);
          await revealFile(uri);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(WorktreeCommands.Refresh, () =>
      worktreeProvider.refresh()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WorktreeCommands.Remove,
      (args: WorktreeTreeItem) =>
        worktreeProvider.removeWorktree(args.worktree.path, false)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WorktreeCommands.RemoveForced,
      (args: WorktreeTreeItem) =>
        worktreeProvider.forceRemove(args.worktree.path)
    )
  );
}

export function deactivate() {}

async function getBuiltInGitApi(): Promise<GitAPI | undefined> {
  try {
    const extension =
      vscode.extensions.getExtension<GitExtension>("vscode.git");
    if (extension !== undefined) {
      const gitExtension = extension.isActive
        ? extension.exports
        : await extension.activate();

      return gitExtension.getAPI(1);
    }
  } catch {}

  return undefined;
}

const subscribeToGitRepoChanges = async (treeProvider: WorktreeProvider) => {
  const builtinGit = await getBuiltInGitApi();
  if (builtinGit) {
    builtinGit.onDidChangeState(() => {
      builtinGit.repositories.forEach((repo) => {
        repo.state.onDidChange(() => {
          treeProvider.refresh();
        });
      });
    });
  }
};
