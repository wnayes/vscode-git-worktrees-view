import * as vscode from "vscode";
import { API as GitAPI, GitExtension } from "./git.d";
import { WorktreeProvider } from "./WorktreeProvider";
import { WorktreeCommands } from "./WorktreeCommands";
import { WorktreeTreeItem } from "./WorktreeTreeItem";
import { revealFile } from "./exec";
import { formatPathForGlob, getResolvedPath } from "./utils";

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
        worktreeProvider.removeWorktree(
          getResolvedPath(args.worktree.path),
          false
        )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WorktreeCommands.RemoveForced,
      (args: WorktreeTreeItem) =>
        worktreeProvider.forceRemove(getResolvedPath(args.worktree.path))
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
    let repoStateChangeListeners: vscode.Disposable[] = [];
    let worktreeFileListeners: vscode.FileSystemWatcher[] = [];

    let timerId: NodeJS.Timeout | undefined;
    const refreshDebounced = () => {
      if (typeof timerId === "undefined") {
        timerId = setTimeout(() => {
          timerId = undefined;
          treeProvider.refresh();
        }, 100);
      }
    };

    const callback = () => {
      repoStateChangeListeners.forEach((disposable) => disposable.dispose());
      repoStateChangeListeners.length = 0;

      worktreeFileListeners.forEach((watcher) => watcher.dispose());
      worktreeFileListeners.length = 0;

      builtinGit.repositories.forEach((repo) => {
        repoStateChangeListeners.push(
          repo.state.onDidChange(() => {
            refreshDebounced();
          })
        );

        // Not in the public typings? If it stops working, we could execute
        // commands to get this path.
        const dotGitPath = (repo as any).repository?.dotGit?.commonPath;
        if (dotGitPath) {
          const worktreesInternalGlob =
            formatPathForGlob(dotGitPath) + "/worktrees";
          const listener = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(worktreesInternalGlob, "**/*"),
            false,
            false,
            false
          );
          listener.onDidChange(() => refreshDebounced());
          listener.onDidCreate(() => refreshDebounced());
          listener.onDidDelete(() => refreshDebounced());
          worktreeFileListeners.push(listener);
        }
      });
    };

    callback(); // Initial call.
    builtinGit.onDidChangeState(callback);
  }
};
