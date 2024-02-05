import * as childProcess from "child_process";
import * as vscode from "vscode";

/** Executes a shell command. */
export function exec(cmd: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    childProcess.exec(cmd, (err, out) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(out);
    });
  });
}

export function execShellCommandAsTask(cmd: string, name: string): void {
  const taskDefinition: vscode.TaskDefinition = {
    type: "git",
  };
  const task = new vscode.Task(
    taskDefinition,
    vscode.TaskScope.Workspace,
    name,
    "git-worktrees-view",
    new vscode.ShellExecution(cmd)
  );
  vscode.tasks.executeTask(task);
}
