Use this file to provide workspace-specific custom instructions to Copilot.

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements (ask for project type, language, and frameworks if not specified).
- [x] Scaffold the Project
	- Ensure the previous step is completed before scaffolding.
	- Call project setup tools with the appropriate `projectType` when available and run scaffolding commands to create files and folders.
	- Use `.` as the working directory unless the user specifies otherwise.
	- If no appropriate `projectType` is available, consult documentation or scaffold manually.

- [ ] Customize the Project
	- Develop a plan to modify the codebase according to user requirements and apply changes using appropriate tools and references.
	- Skip this step for "Hello World" projects.

- [x] Install Required Extensions
	- ONLY install extensions provided by `get_project_setup_info`; skip otherwise.

- [ ] Compile the Project
	- Install missing dependencies, run diagnostics, and resolve issues. Check repository markdown for project-specific build instructions.

- [ ] Create and Run Task
	- If needed, create a `tasks.json` task using `create_and_run_task` based on `package.json`, `README.md`, and project structure.

- [ ] Launch the Project
	- Prompt the user for debug mode before launching.

- [ ] Ensure Documentation is Complete
	- Verify `README.md` and `.github/copilot-instructions.md` contain current project information.

## Execution Guidelines

- Progress tracking: use available tools to track checklist progress and add brief summaries when steps complete.
- Communication: keep messages concise; avoid printing full command outputs. If a step is skipped, state that briefly.
- Development rules: use `.` as the working directory by default; avoid adding external links or media unless explicitly requested.
- Folder creation: do not create new top-level folders unless requested; creating a `.vscode` folder for `tasks.json` is acceptable.
- Extension installation: install only extensions specified by `get_project_setup_info`.
- Project content: assume a "Hello World" starter when details are missing; prompt for clarification when features are assumed.

Task completion criteria:
- Project is scaffolded and compiles without errors (when applicable).
- `.github/copilot-instructions.md` exists (this file).
- `README.md` exists and is up to date.
- User has clear launch/debug instructions.

- Work through checklist items systematically, keep communication focused, and follow development best practices.
