# Git Worktrees View

Switch between Git worktrees in Visual Studio Code.

## Features

- Change your current window to a different Git worktree in one click.
- Open other worktrees in separate windows.
- Remove worktrees (forced / unforced)
- Filtering out worktrees by path or branch.
- Grouping worktrees based on path.
- Refreshes automatically when worktrees change.
- Configurable custom description in worktree tooltip.

## Configuration

| Setting                                          | Description                                                                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git-worktrees-view.branchDescriptionExecutable` | A program/script that returns a description string when passed the name of a branch. Can be used to add description values into the tooltip for each worktree.                                 |
| `git-worktrees-view.ignoreBranches`              | Branch name patterns for worktrees to ignore when building the view.<br><br>Example: `**/main` to hide the `main` branch.                                                                      |
| `git-worktrees-view.ignorePaths`                 | Path patterns for worktrees to ignore when building the view.<br><br>Example: `**/foo` to hide worktrees that are in directories named `foo`.                                                  |
| `git-worktrees-view.pathNodeParentMap`           | Places worktrees into sub-tree nodes based on path matching.<br><br>Example: Put worktrees in paths matching `**/foo` into a `foos` tree node.<br>`{ pathPattern: "**/foo", parent: "foos" }]` |

## License

MIT License

```

```
