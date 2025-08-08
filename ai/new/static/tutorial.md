---
title: Build an app from any tutorial
description: Given a tutorial url, understand its content and build a minimal app that works.
url: Enter the url of the tutorial website to read and build the app from
prompt: Enter the description of the app you would like to build based on this tutorial
---

# Tutorial Implementation Specification

## Source Material
**URL**: {{url}}
**Prompt**: {{prompt}}

## Objective
Visit the provided URL, understand the concept or technique being explained, and build a minimal working implementation based on the content. Build what the user requested through the provided prompt.

## Analysis Task
1. Read through the entire page/tutorial
2. Identify the main concept, algorithm, or technique being taught
3. Extract any code examples or pseudocode provided
4. Understand the problem being solved and the solution approach
5. Note any specific implementation details or requirements mentioned

## Implementation Strategy
- **Use provided code**: If the page contains code examples, use them as the foundation
- **Follow the explanation**: Implement the concept as described in the tutorial
- **Minimal but complete**: Build the simplest version that demonstrates the concept
- **Stay true to source**: Prefer the tutorial's approach over alternatives

## Technical Requirements
- **Language/Framework**: Use what's suggested in the tutorial, or default to:
  - Web concepts: HTML/CSS/JavaScript or React
  - Algorithms: JavaScript or Python
  - Gradio preferred if python: If the demo is in python, use gradio to implement.
- Clean, readable code with comments explaining key concepts
- Working example that can be run/tested
- Try to make it cross platform as much as possible (all operating systems).

## Deliverables
- Working implementation of the concept
- Code that follows the tutorial's approach
- Comments linking implementation to tutorial concepts
- Simple test/demo showing it works
- Pinokio launcher to install and launch the app

## Success Criteria
- Implementation correctly demonstrates the tutorial's concept
- Code reflects the approach described in the source material
- Working example can be executed and tested
- Clear connection between tutorial content and implementation
