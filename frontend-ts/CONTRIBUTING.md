# Contributing Guidelines

Want to contribute to this project? We ❤️ it!

Here are a few types of contributions that we would be interested in hearing about.

- Bug fixes
  - If you find a bug, please first report it using Github Issues.
  - Issues that have already been identified as a bug will be labeled `🐛 bug`.
    - If you'd like to submit a fix for a bug, send a Pull Request from your own fork and mention the Issue number.
      - Include a test that isolates the bug and verifies that it was fixed.
- New Features
  - If you'd like to accomplish something in the extension that it doesn't already do, describe the problem in a new Github Issue.
    - Issues that have been identified as a feature request will be labeled `✨ enhancement`.
    - If you'd like to implement the new feature, please wait for feedback from the project maintainers before spending
      too much time writing the code. In some cases, `✨ enhancement`s may not align well with the project objectives at
      the time.
- Tests, Documentation, Miscellaneous
  - If you think the test coverage could be improved, the documentation could be clearer, you've got an alternative
    implementation of something that may have more advantages, or any other change we would still be glad hear about
    it.
    - If its a trivial change, go ahead and send a Pull Request with the changes you have in mind
    - If not, open a Github Issue to discuss the idea first.
- Snippets
  - To add snippets:
    - Add a directory in the `snippets` folder with the name of the language.
    - Add one or more files in the language directory with snippets.
    - Update the `package.json` to include the snippets you added.

We also welcome anyone to work on any existing issues with the `👋🏽 good first issue` tag.

## Requirements

For a contribution to be accepted:

- The test suite must be complete and pass
- Code must follow existing styling conventions
- Commit messages must be descriptive. Related issues should be mentioned by number.

If the contribution doesn't meet these criteria, a maintainer will discuss it with you on the Issue. You can still
continue to add more commits to the branch you have sent the Pull Request from.

## How To

1. Fork this repository on GitHub.
1. Clone/fetch your fork to your local development machine.
1. Create a new branch (e.g. `issue-12`, `feat.add_foo`, etc) and check it out.
1. Make your changes and commit them. (Did the tests pass? No linting errors?)
1. Push your new branch to your fork. (e.g. `git push myname issue-12`)
1. Open a Pull Request from your new branch to the original fork's `main` branch.
