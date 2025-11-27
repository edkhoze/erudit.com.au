---
title: "My Thoughts on Google's Antigravity IDE"
date: "2024-11-27"
excerpt: "Google's Antigravity IDE is a game-changer for software development. Built on VS Code, it integrates advanced AI agents for a seamless workflow."
tags: ["Antigravity", "IDE", "Google", "AI", "LLM", "Software Development"]
---

This website was developed entirely using **Google's Antigravity IDE**, leveraging a modern **React + Next.js** stack.

![Antigravity IDE Concept](/images/antigravity-ide.png)

## A Familiar Yet Powerful Experience

Antigravity is essentially another **VS Code clone**, but with some new capabilities and built-in goodies line Gemini 3 Pro model, ability to generate images on the fly using Google's latest image generation models, as well as this cool feature that allows it to test your website in Chrome using Antigravity plugin, akin to Selenium UI tests. It does feel similar to vanilla VS Code with GitHub Copilot plugged in, and that's a good thing in my book.

As of **November 2025**, it's currently free to use, but I already have ran into some limits that reset in 24 hours. I've been powering my development with the **Gemini 3 Pro** model, which has been impressive, but other options are available, such as **Claude Sonnet** or **GPT-OSS** models. 

## Agentic Capabilities

What sets Antigravity apart is its "Agentic" nature. It's not just code completion; it's a pair programmer that can perform complex tasks. That means it can do everything by itself or - and that's what I've been using - do planning mode first and then ask for approval for each change.

![AI Agent Coding](/images/ai-agent.png)

### Native Browser Testing

One of the standout features is the ability to test the website you are building by launching a **Chrome browser** instance (via a plugin). The agent can navigate your site, scroll, click, and verify UI elements, effectively performing tasks similar to **Selenium UI automated tests** but driven by natural language instructions.

### Native Image Generation

Need assets? Antigravity has the ability to **natively generate images** using Google's latest image generation models. As you no doubt can tell, the images in this blog post have been created this way.

## Planning Mode: A Game Changer

I've been using the **Planning Mode**, which feels similar to Cursor 2 / vanilla VS Code but even more refined. I really like it. The workflow is wonderful:

1.  It creates a detailed **Implementation Plan**.
2.  It creates a **Task List** and ticks off items one-by-one as it executes them.
3.  Finally, it generates a **Walkthrough** explaining exactly what it achieved.

This structured approach keeps the development focused and transparent.

## Final Verdict

Overall, I've come away impressed. It's a powerful tool that streamlines the process of building simple websites like this one. 

> It's not without its issues, obviously—there are some bugs that need to be iterated over and fixed, but that's to be expected with such cutting-edge technology.

I do wonder how much it will cost in the future, but for now, it's a fantastic addition to the developer's toolkit. 

> The question is - is it really better than VS Code + GitHub Copilot or Cursor 2? IMHO, it's too early to tell at this point!
