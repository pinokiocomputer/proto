---
title: Launch any app
description: Given a git url, analyize and build a launcher.
url: Enter the url of the git repository to install from.
.gitignore: /app/
---

# Pinokio Launcher Specification

## Target Project
**Repository URL**: {{url}}

## Objective
Create a Pinokio launcher for the existing open source project by analyzing its documentation and codebase to understand setup, installation, and launch procedures.

## Pinokio Script Requirements
Create a Pinokio script that:
- Clones the repository to the appropriate location (`app` folder)
- Installs all required dependencies
- Handles any setup or configuration steps
- Launches the application as intended by the original developers
- Provides clear status feedback during each step

## Key Requirements
- **No modifications**: Do not alter the original project code
- **Follow official docs**: Use installation/launch methods from project documentation
- **Preserve functionality**: Maintain all original features and capabilities
- **Clean installation**: Ensure reproducible setup process
- **Proper isolation**: Use appropriate virtual environments if needed
- **Cross platform**: Try to make the launcher cross platform

## Deliverables
- Working Pinokio script
- Any required configuration files

## Success Criteria
- Script successfully clones the repository into the `app` folder
- Script successfully launches the project
- All dependencies install without errors
- Application launches as intended by original developers
- All original functionality is preserved and accessible
- Process is repeatable and reliable
