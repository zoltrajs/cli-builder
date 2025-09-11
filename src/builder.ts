import {
  CLIOption,
  CLIArgument,
  CLICommand,
  CLIBuilder,
  CommandBuilder,
  CLIBuilderOptions,
} from "./types";
import { ZoltraCLIParser } from "./parser.js";
import chalk from "chalk";

export class ZoltraCLIBuilder implements CLIBuilder {
  private commands: CLICommand[] = [];
  private globalOptions: CLIOption[] = [];
  private name: string;
  private version: string;
  private description: string | undefined;
  private interactive: boolean = false;

  constructor(name: string, version: string, description?: string, options?: CLIBuilderOptions) {
    this.name = name;
    this.version = version;
    this.description = description;
    this.interactive = options?.interactive || false;

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

  setInteractive(interactive: boolean): CLIBuilder {
    this.interactive = interactive;
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
      
      // Validate required options with interactive prompts if enabled
      const validatedParsed = await ZoltraCLIParser.validateOptions(
        commandParsed, 
        [...this.globalOptions, ...(command.options || [])],
        this.interactive
      );

      await command.action(validatedParsed.args, validatedParsed.options);
    } catch (error) {
      console.error(chalk.bold.red("ERROR") + " 🚫");
      console.error(
        chalk.red(
          `${error instanceof Error ? error.message : String(error)}`
        )
      );
      
      // Provide more helpful context based on error type
      if (error instanceof Error) {
        if (error.message.includes("Missing required")) {
          console.log(chalk.yellow("\nRequired parameter missing. Check command usage below:"));
          this.showCommandHelp(error.message.split(":")[1]?.trim() || "");
        } else if (error.message.includes("Unknown command")) {
          console.log(chalk.yellow("\nAvailable commands:"));
          this.listCommands();
        } else {
          console.log(chalk.yellow("\nUse --help for usage information."));
        }
      } else {
        console.log(chalk.yellow("\nUse --help for usage information."));
      }
      
      process.exit(1);
    }
  }

  showHelp(): void {
    console.log(chalk.bold.blue(`${this.name} v${this.version}`));
    if (this.description) {
      console.log(this.description);
    }
    console.log();

    console.log(chalk.bold("Usage:"));
    console.log(`  ${chalk.cyan(this.name)} ${chalk.green("[command]")} ${chalk.yellow("[options]")}`);
    console.log();

    this.listCommands();
    this.showGlobalOptions();

    console.log(
      `Run '${chalk.cyan(this.name)} ${chalk.green("[command]")} ${chalk.yellow("--help")}' for more information about a command.`
    );
  }

  listCommands(): void {
    if (this.commands.length > 0) {
      console.log(chalk.bold("Commands:"));
      const commandList = this.commands
        .filter(command => command.name) // Filter out default command
        .map(command => {
          const aliases = command.aliases
            ? ` (${command.aliases.join(", ")})`
            : "";
          const name = command.name.padEnd(15);
          return `  ${chalk.green(name)}${chalk.dim(aliases)}  ${command.description}`;
        });
      
      console.log(commandList.join("\n"));
      console.log();
    }
  }

  showGlobalOptions(): void {
    if (this.globalOptions.length > 0) {
      console.log(chalk.bold("Global Options:"));
      const optionList = this.globalOptions.map(option => {
        const flags = option.alias
          ? `-${option.alias}, --${option.name}`
          : `--${option.name}`;
        const flagsFormatted = chalk.yellow(flags.padEnd(20));
        const required = option.required ? chalk.red(" (required)") : "";
        const defaultValue = option.default !== undefined 
          ? chalk.dim(` (default: ${option.default})`) 
          : "";
        return `  ${flagsFormatted}${option.description}${required}${defaultValue}`;
      });
      
      console.log(optionList.join("\n"));
      console.log();
    }
  }

  showCommandHelp(commandName: string): void {
    const command = this.commands.find(
      (cmd) => cmd.name === commandName || cmd.aliases?.includes(commandName)
    );

    if (!command) {
      console.log(chalk.yellow(`Command '${commandName}' not found.`));
      this.showHelp();
      return;
    }

    console.log(chalk.bold.blue(`${this.name} - ${command.name}`));
    console.log(command.description);
    console.log();

    console.log(chalk.bold("Usage:"));
    const args = command.arguments?.map(arg => {
      const required = arg.required ? "" : "[";
      const requiredEnd = arg.required ? "" : "]";
      const variadic = arg.variadic ? "..." : "";
      return `${required}${variadic}${arg.name}${requiredEnd}`;
    }).join(" ") || "";

    console.log(`  ${chalk.cyan(this.name)} ${chalk.green(command.name)} ${chalk.yellow("[options]")} ${args}`);
    console.log();

    if (command.arguments && command.arguments.length > 0) {
      console.log(chalk.bold("Arguments:"));
      const argList = command.arguments.map(arg => {
        const name = arg.name.padEnd(15);
        const required = arg.required ? chalk.red(" (required)") : "";
        const variadic = arg.variadic ? chalk.blue(" (variadic)") : "";
        return `  ${chalk.green(name)}${arg.description}${required}${variadic}`;
      });
      
      console.log(argList.join("\n"));
      console.log();
    }

    if (command.options && command.options.length > 0) {
      console.log(chalk.bold("Command Options:"));
      const optionList = command.options.map(option => {
        const flags = option.alias
          ? `-${option.alias}, --${option.name}`
          : `--${option.name}`;
        const flagsFormatted = chalk.yellow(flags.padEnd(20));
        const required = option.required ? chalk.red(" (required)") : "";
        const defaultValue = option.default !== undefined 
          ? chalk.dim(` (default: ${option.default})`) 
          : "";
        return `  ${flagsFormatted}${option.description}${required}${defaultValue}`;
      });
      
      console.log(optionList.join("\n"));
      console.log();
    }

    this.showGlobalOptions();
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
  description?: string,
  options?: CLIBuilderOptions
): CLIBuilder {
  return new ZoltraCLIBuilder(name, version, description, options);
}
