/** Representation of a worktree. */
export interface IWorktree {
  path: string;
  branch: string;
  head: string;
  bare?: boolean;
  detached?: boolean;
  prunable?: string | true;
  locked?: string | true;
}

/** Parses the `git worktree list --porcelain -z` output. */
export function parseWorktreePorcelain(output: string): IWorktree[] {
  const worktrees: IWorktree[] = [];

  let currentWorktree: IWorktree | undefined;
  let i = 0;
  while (i < output.length) {
    const lineEnd = output.indexOf("\0", i);
    const line = output.substring(i, lineEnd >= 0 ? lineEnd : output.length);
    i = lineEnd + 1;

    if (line.startsWith("worktree ")) {
      if (currentWorktree) {
        worktrees.push(currentWorktree);
      }
      currentWorktree = {
        path: line.substring("worktree ".length),
        branch: "",
        head: "",
      };
    } else if (currentWorktree) {
      if (!line) {
        if (currentWorktree) {
          worktrees.push(currentWorktree);
          currentWorktree = undefined;
        }
      } else if (line.startsWith("HEAD ")) {
        currentWorktree.head = line.substring("HEAD ".length);
      } else if (line.startsWith("branch ")) {
        currentWorktree.branch = line.substring("branch ".length);
      } else if (line === "detached") {
        currentWorktree.detached = true;
      } else if (line === "bare") {
        currentWorktree.bare = true;
      } else if (line.startsWith("prunable")) {
        currentWorktree.prunable = line
          .substring("prunable".length)
          .trimStart();
        if (!currentWorktree.prunable) {
          currentWorktree.prunable = true;
        }
      } else if (line.startsWith("locked")) {
        currentWorktree.locked = line.substring("locked".length).trimStart();
        if (!currentWorktree.locked) {
          currentWorktree.locked = true;
        }
      }
    }
  }

  return worktrees;
}
