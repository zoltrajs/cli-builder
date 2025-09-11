export interface CLIOption {
  name: string;
  alias?: string;
  description: string;
  type: "string" | "number" | "boolean" | "array";
  required?: boolean;
  default?: any;
  choices?: string[];
}

export interface CLIArgument {
  name: string;
  description: string;
  required?: boolean;
  variadic?: boolean;
}

export interface CLICommand {
  name: string;
  description: string;
  aliases?: string[];
  options?: CLIOption[];
  arguments?: CLIArgument[];
  action: (args: any, options: any) => void | Promise<void>;
  subcommands?: CLICommand[];
}

export interface CLIConfig {
  name: string;
  version: string;
  description?: string;
  commands: CLICommand[];
  globalOptions?: CLIOption[];
}

export interface ParsedArgs {
  command: string[];
  options: Record<string, any>;
  args: string[];
}

export interface CLIBuilderOptions {
  interactive?: boolean;
}

export interface CLIBuilder {
  command(name: string, description: string): CommandBuilder;
  option(
    name: string,
    description: string,
    config?: Partial<CLIOption>
  ): CLIBuilder;
  action(
    handler: (args: any, options: any) => void | Promise<void>
  ): CLIBuilder;
  parse(argv?: string[]): Promise<void>;
  showHelp(): void;
  addCommand(command: CLICommand): void;
  setInteractive(interactive: boolean): CLIBuilder;
}

export interface CommandBuilder {
  alias(alias: string): CommandBuilder;
  option(
    name: string,
    description: string,
    config?: Partial<CLIOption>
  ): CommandBuilder;
  argument(
    name: string,
    description: string,
    config?: Partial<CLIArgument>
  ): CommandBuilder;
  action(
    handler: (args: any, options: any) => void | Promise<void>
  ): CommandBuilder;
  command(name: string, description: string): CommandBuilder;
  parse(argv?: string[]): Promise<void>;
  showHelp(): void;
  /**  Adds the current command to its parent builder */
  finalize(): void;
}
