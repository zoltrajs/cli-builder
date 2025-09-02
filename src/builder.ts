import {
  CLIOption,
  CLIArgument,
  CLICommand,
  CLIBuilder,
  CommandBuilder,
} from "./types";
import { ZoltraCLIParser } from "./parser.js";
import chalk from "chalk";

export class ZoltraCLIBuilder implements CLIBuilder {
  private commands: CLICommand[] = [];
  private globalOptions: CLIOption[] = [];
  private name: string;
  private version: string;
  private description: string | undefined;

  constructor(name: string, version: string, description?: string) {
    this.name = name;
    this.version = version;
    this.description = description;

    // Add default global options
    this.globalOptions.push(
      {
        name: "help",
        alias: "h",
        type: "boolean",
        description: "Show help information",
      },
      {
        name: "version",
        alias: "V",
        type: "boolean",
        description: "Show version number",
      }
    );
  }

  command(name: string, description: string): CommandBuilder {
    return new ZoltraCommandBuilder(this, name, description);
  }

  addCommand(command: CLICommand): void {
    this.commands.push(command);
  }

  option(
    name: string,
    description: string,
    config: Partial<CLIOption> = {}
  ): CLIBuilder {
    this.globalOptions.push({
      name,
      description,
      type: "boolean",
      ...config,
    });
    return this;
  }

  action(
    handler: (args: any, options: any) => void | Promise<void>
  ): CLIBuilder {
    // Default command action
    this.commands.push({
      name: "",
      description: "Default command",
      action: handler,
    });
    return this;
  }

  async parse(argv: string[] = process.argv): Promise<void> {
    try {
      // Finalize any pending commands from command builders
      // This is a no-op for the main CLI, but ensures commands are added

      const parsed = ZoltraCLIParser.parse(argv, this.globalOptions);

      // Handle global options
      if (parsed.options.help) {
        this.showHelp();
        return;
      }

      if (parsed.options.version) {
        console.log(`${this.name} v${this.version}`);
        return;
      }

      // Find and execute command
      const commandName = parsed.command[0] || "";
      const command = this.commands.find(
        (cmd) => cmd.name === commandName || cmd.aliases?.includes(commandName)
      );

      if (!command) {
        if (this.commands.length === 1 && this.commands[0]?.name === "") {
          // Default command
          await this.commands[0]?.action(parsed.args, parsed.options);
        } else {
          throw new Error(`Unknown command: ${commandName}`);
        }
        return;
      }

      // Parse command-specific options and args
      const commandParsed = ZoltraCLIParser.parse(
        argv,
        [...this.globalOptions, ...(command.options || [])],
        command.arguments || []
      );

      // Validate arguments
      ZoltraCLIParser.validateArgs(commandParsed, command.arguments || []);

      await command.action(commandParsed.args, commandParsed.options);
    } catch (error) {
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      console.log("\nUse --help for usage information.");
      process.exit(1);
    }
  }

  showHelp(): void {
    console.log(chalk.bold(`${this.name} v${this.version}`));
    if (this.description) {
      console.log(this.description);
    }
    console.log();

    console.log(chalk.bold("Usage:"));
    console.log(`  ${this.name} [command] [options]`);
    console.log();

    if (this.commands.length > 0) {
      console.log(chalk.bold("Commands:"));
      for (const command of this.commands) {
        if (command.name) {
          const aliases = command.aliases
            ? ` (${command.aliases.join(", ")})`
            : "";
          console.log(
            `  ${chalk.cyan(command.name)}${aliases}    ${command.description}`
          );
        }
      }
      console.log();
    }

    if (this.globalOptions.length > 0) {
      console.log(chalk.bold("Global Options:"));
      for (const option of this.globalOptions) {
        const flags = option.alias
          ? `-${option.alias}, --${option.name}`
          : `--${option.name}`;
        const required = option.required ? " (required)" : "";
        console.log(
          `  ${chalk.yellow(flags)}    ${option.description}${required}`
        );
      }
      console.log();
    }

    console.log(
      `Run '${this.name} [command] --help' for more information about a command.`
    );
  }
}

export class ZoltraCommandBuilder implements CommandBuilder {
  private cmd: CLICommand;
  private parent: ZoltraCLIBuilder;

  constructor(parent: ZoltraCLIBuilder, name: string, description: string) {
    this.parent = parent;
    this.cmd = {
      name,
      description,
      action: () => {},
    };
  }

  alias(alias: string): CommandBuilder {
    if (!this.cmd.aliases) {
      this.cmd.aliases = [];
    }
    this.cmd.aliases.push(alias);
    return this;
  }

  option(
    name: string,
    description: string,
    config: Partial<CLIOption> = {}
  ): CommandBuilder {
    if (!this.cmd.options) {
      this.cmd.options = [];
    }
    this.cmd.options.push({
      name,
      description,
      type: "boolean",
      ...config,
    });
    return this;
  }

  argument(
    name: string,
    description: string,
    config: Partial<CLIArgument> = {}
  ): CommandBuilder {
    if (!this.cmd.arguments) {
      this.cmd.arguments = [];
    }
    this.cmd.arguments.push({
      name,
      description,
      ...config,
    });
    return this;
  }

  action(
    handler: (args: any, options: any) => void | Promise<void>
  ): CommandBuilder {
    this.cmd.action = handler;
    return this;
  }

  command(name: string, description: string): CommandBuilder {
    // Add current command to parent
    this.parent.addCommand(this.cmd);

    // Create new command builder
    return new ZoltraCommandBuilder(this.parent, name, description);
  }

  async parse(argv: string[] = process.argv): Promise<void> {
    // Add current command to parent
    this.parent.addCommand(this.cmd);

    // Parse using parent
    await this.parent.parse(argv);
  }

  showHelp(): void {
    this.parent.addCommand(this.cmd);
    this.parent.showHelp();
  }

  finalize(): void {
    this.parent.addCommand(this.cmd);
  }
}

// Factory function for creating CLI builders
export function createCLI(
  name: string,
  version: string,
  description?: string
): CLIBuilder {
  return new ZoltraCLIBuilder(name, version, description);
}
