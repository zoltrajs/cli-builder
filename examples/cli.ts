#!/usr/bin/env node

import { createCLI } from "../src/builder.js";

// Create a demo CLI application
const cli = createCLI(
  "fast-cli-builder",
  "1.0.0",
  "A fast CLI builder for TypeScript applications"
);

// Add global options
cli.option("verbose", "Enable verbose output", { alias: "v", type: "boolean" });
cli.option("config", "Path to config file", { type: "string" });

// Add commands
const buildCmd = cli
  .command("build", "Build the project")
  .option("output", "Output directory", {
    alias: "o",
    type: "string",
    default: "./dist",
  })
  .option("watch", "Watch for changes", { alias: "w", type: "boolean" })
  .action(async (args, options) => {
    console.log("Building project...");
    if (options.verbose) {
      console.log("Verbose mode enabled");
      console.log("Output directory:", options.output);
      console.log("Watch mode:", options.watch);
    }
    // Simulate build process
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Build completed successfully!");
  });

const testCmd = cli
  .command("test", "Run tests")
  .option("coverage", "Generate coverage report", { type: "boolean" })
  .option("pattern", "Test file pattern", {
    type: "string",
    default: "**/*.test.ts",
  })
  .action(async (args, options) => {
    console.log("Running tests...");
    if (options.coverage) {
      console.log("Generating coverage report...");
    }
    // Simulate test execution
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("All tests passed!");
  });

const serveCmd = cli
  .command("serve", "Start development server")
  .option("port", "Port to listen on", {
    alias: "p",
    type: "number",
    default: 3000,
  })
  .option("host", "Host to bind to", { type: "string", default: "localhost" })
  .action(async (args, options) => {
    console.log(`Starting server on ${options.host}:${options.port}...`);
    // Simulate server startup
    console.log("Server started successfully!");
    console.log(`Listening on http://${options.host}:${options.port}`);
  });

const greetCmd = cli
  .command("greet", "Greet someone")
  .argument("name", "Name to greet", { required: true })
  .option("style", "Greeting style", {
    choices: ["formal", "casual"],
    default: "casual",
  })
  .action(async (args, options) => {
    const greeting = options.style === "formal" ? "Hello" : "Hey";
    console.log(`${greeting}, ${args[0]}!`);
  });

// Finalize command
serveCmd.finalize();
greetCmd.finalize();
buildCmd.finalize();
testCmd.finalize();

// Parse command line arguments
cli.parse().catch(console.error);
