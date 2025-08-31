# Development Guilde for Serverless Apps

"Serverless apps" are web apps made up solely of static HTML files, which may operate by making network requests to 3rd party backends, which may include localhost APIs or public APIs. Some characteristics:

1. No need to spin up a server since the index.html file is served by the Pinokio server that's already running.
2. The app shall never have its own API backend or server. Instead it interacts with 3rd party APIs.
3. Therefore the app is solely made up of HTML/JS/CSS files.

## Project Structure

```
project-root/
├── README.md            # Documentation
├── pinokio.js           # UI generator script
├── pinokio.json         # Metadata (title, description, icon)
└── index.html           # Main web app
```

## Key Rules
- The app always launches at `index.html`, so most features should be written in index.html, and the index.html should not be deleted.
- You may add more files (HTML, JavaScript, CSS, asset files, etc.) but should still assume the index.html is the main entry point.

## Documentation

ALWAYS write a documentation. A documentation must be stored as `README.md` in the project root folder, along with the rest of the pinokio launcher script files. A documentation file must contain:
- What the app does
- How to use the app
- One or more screenshots of the app in use. Taking a screenshot can be achieved through the CLI command `browserless screenshot <URL> --path <FILE_PATH_TO_STORE_TO>`. For example, `browserless screenshot http://localhost:8610 --path github.png`
- API documentation for programmatically accessing the app's main features (Javascript, Python, and Curl)

## Development Workflow

### 1. Understanding the Project
- Read `SPEC.md` in project root to learn about the project details (what and how to build)
- If no `SPEC.md` exists, build based on user requirements
