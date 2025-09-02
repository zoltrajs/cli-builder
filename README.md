# Zoltra CLI Builder

A fast and lightweight CLI builder for TypeScript applications with excellent performance and developer experience.

## Features

- 🚀 **Fast**: Optimized parsing with caching for high performance
- 🎯 **TypeScript**: Full TypeScript support with type safety
- 🛠️ **Flexible**: Support for commands, options, arguments, and subcommands
- 🎨 **Beautiful**: Colored output with chalk integration
- 📚 **Help System**: Auto-generated help and usage information
- 🔧 **Extensible**: Easy to extend and customize

## Installation

```bash
npm install @zoltra/cli-builder
```

## Quick Start

```typescript
import { createCLI } from "@zoltra/cli-builder";

const cli = createCLI("myapp", "1.0.0", "My awesome CLI app");

// Add global options
cli.option("verbose", "Enable verbose output", { alias: "v", type: "boolean" });

// Add commands
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
greetCmd.finalize();

// Parse and run
cli.parse();
```

## Usage

### Basic Commands

```bash
# Show help
myapp --help

# Run a command
myapp greet "World"

# Use options
myapp greet "World" --style formal

# Use short options
myapp greet "World" -v
```

### Command Definition

```typescript
cli
  .command("build", "Build the project")
  .option("output", "Output directory", {
    alias: "o",
    type: "string",
    default: "./dist",
  })
  .option("watch", "Watch for changes", {
    alias: "w",
    type: "boolean",
  })
  .argument("source", "Source directory", {
    required: true,
  })
  .action(async (args, options) => {
    console.log(`Building from ${args[0]} to ${options.output}`);
    if (options.watch) {
      console.log("Watching for changes...");
    }
  });
```

### Option Types

- `boolean`: True/false flags
- `string`: Text values
- `number`: Numeric values
- `array`: Comma-separated values

### Global Options

```typescript
cli.option("config", "Path to config file", {
  type: "string",
  default: "./config.json",
});
```

### Subcommands

```typescript
const deployCmd = cli.command("deploy", "Deploy the application");

deployCmd.command("staging", "Deploy to staging").action(async () => {
  console.log("Deploying to staging...");
});

deployCmd
  .command("production", "Deploy to production")
  .option("confirm", "Skip confirmation", { type: "boolean" })
  .action(async (args, options) => {
    if (!options.confirm) {
      // Ask for confirmation
    }
    console.log("Deploying to production...");
  });
```

## API Reference

### createCLI(name, version, description?)

Creates a new CLI instance.

- `name`: CLI name
- `version`: CLI version
- `description?`: Optional description

### CLI Methods

#### .command(name, description)

Add a new command.

#### .option(name, description, config?)

Add a global option.

#### .action(handler)

Set the default action.

#### .parse(argv?)

Parse command line arguments and execute.

### Command Builder Methods

#### .alias(alias)

Add an alias for the command.

#### .option(name, description, config?)

Add an option to the command.

#### .argument(name, description, config?)

Add an argument to the command.

#### .action(handler)

Set the command action.

#### .command(name, description)

Add a subcommand.

## Advanced Usage

### Custom Validation

```typescript
cli
  .command("create", "Create a new item")
  .argument("type", "Item type", {
    required: true,
    // Custom validation can be added here
  })
  .action(async (args) => {
    const [type] = args;
    // Your logic here
  });
```

### Async Actions

All actions support async/await:

```typescript
cli.command("fetch", "Fetch data").action(async (args, options) => {
  const data = await fetchData();
  console.log(data);
});
```

### Error Handling

The CLI automatically handles errors and displays them with colored output:

```typescript
cli.command("dangerous", "A dangerous command").action(async () => {
  throw new Error("Something went wrong!");
});
```

## Performance

Fast CLI Builder is optimized for performance:

- **Regex caching**: Pre-compiled regular expressions
- **Option caching**: Cached option lookups to avoid repeated searches
- **Lazy evaluation**: Options are only parsed when needed
- **Minimal dependencies**: Small bundle size

## Examples

See the `examples/` directory for more usage examples:

- Basic CLI
- Multi-command CLI
- Interactive CLI
- Configuration management

## Contributing

Contributions are welcome! Please see the contributing guidelines.

## License

MIT
