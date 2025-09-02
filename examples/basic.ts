#!/usr/bin/env node

import { createCLI } from "../src";

const cli = createCLI("my-cli", "1.0.0", "A simple CLI example");

// Global options
cli.option("verbose", "Enable verbose output", { alias: "v", type: "boolean" });
cli.option("config", "Config file path", {
  type: "string",
  default: "./config.json",
});

// Commands
cli
  .command("hello", "Say hello")
  .argument("name", "Name to greet", { required: true })
  .option("times", "Number of times to greet", { type: "number", default: 1 })
  .action(async (args, options) => {
    const [name] = args;
    for (let i = 0; i < options.times; i++) {
      console.log(`Hello, ${name}!`);
    }
    if (options.verbose) {
      console.log("Verbose mode: Greeting completed");
    }
  });

cli
  .command("build", "Build the project")
  .option("output", "Output directory", {
    alias: "o",
    type: "string",
    default: "./dist",
  })
  .option("watch", "Watch for changes", { alias: "w", type: "boolean" })
  .action(async (args, options) => {
    console.log(`Building project to ${options.output}...`);
    if (options.watch) {
      console.log("Watching for file changes...");
    }
    // Simulate build process
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Build completed!");
  });

// Default action
cli.action(async (args, options) => {
  console.log("Welcome to My CLI!");
  console.log("Use --help to see available commands.");
});

// Parse and run
cli.parse().catch(console.error);
