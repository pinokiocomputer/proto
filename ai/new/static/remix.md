---
title: Remix any app
description: Given a git url, clone, make the requested changes, and build a launcher.
url: Enter the url of the git repository to install from.
prompt: Enter the modifications to make to the existing app that's been cloned.
.gitignore: /app/
---

# Remix App Specification

## Source Project
**Repository URL**: {{url}}
**Modification Instructions**: {{prompt}}

## Objective
Write a launcher that clones the existing Git project, understand its structure and functionality. And then implement the specific changes requested by the user to the cloned app's code base while maintaining the project's integrity and coding standards.

## Pinokio Script Requirements
Create a Pinokio script that:
- Clones the repository to the appropriate location (`app` folder)
- Installs all required dependencies
- Handles any setup or configuration steps
- Launches the application as intended by the original developers
- Provides clear status feedback during each step

## Deliverables
- Working Pinokio script
- Modified project with requested changes implemented
- Summary of all changes made
- Updated documentation if applicable
- Testing verification that changes work correctly
- Preserved git history with meaningful commit messages

## Change Documentation
- List all modified files
- Explain what each change does and why
- Note any new dependencies added
- Document any configuration changes needed
- Provide testing instructions for the changes

## Success Criteria
- All requested modifications are implemented correctly
- Existing functionality remains intact
- Code follows the project's established patterns
- Changes are well-documented and maintainable
- Project can be built and run successfully with modifications
