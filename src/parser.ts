import { CLIOption, CLIArgument, ParsedArgs } from "./types";
import prompts from "prompts";

export class ZoltraCLIParser {
  // Pre-compiled regexes for better performance
  private static readonly OPTION_REGEX =
    /^--?([a-zA-Z][a-zA-Z0-9_-]*)(?:=(.+))?$/;
  private static readonly SHORT_OPTION_REGEX = /^-([a-zA-Z0-9]+)$/;

  // Cache for option lookups to avoid repeated array searches
  private static optionCache = new Map<string, CLIOption | null>();

  static clearCache(): void {
    this.optionCache.clear();
  }

  static parse(
    argv: string[],
    options: CLIOption[] = [],
    args: CLIArgument[] = []
  ): ParsedArgs {
    const parsed: ParsedArgs = {
      command: [],
      options: {},
      args: [],
    };

    let i = 0;
    const tokens = argv.slice(2); // Skip node and script path

    // Set default values for options
    for (const option of options) {
      if (option.default !== undefined) {
        parsed.options[option.name] = option.default;
      }
    }

    while (i < tokens.length) {
      const token = tokens[i];
      if (!token) {
        i++;
        continue;
      }

      if (this.isOption(token)) {
        const { name, value } = this.parseOption(token, tokens, i);
        const cacheKey = `${name}:${options.length}`;
        let option = this.optionCache.get(cacheKey);

        if (option === undefined) {
          option =
            options.find((opt) => opt.name === name || opt.alias === name) ||
            null;
          this.optionCache.set(cacheKey, option);
        }

        if (option) {
          parsed.options[option.name] = this.parseOptionValue(value, option);
        }
        i++;
      } else if (token.startsWith("-")) {
        // Handle combined short options like -abc
        const shortOpts = token.slice(1);
        for (const shortOpt of shortOpts) {
          const cacheKey = `alias:${shortOpt}:${options.length}`;
          let option = this.optionCache.get(cacheKey);

          if (option === undefined) {
            option = options.find((opt) => opt.alias === shortOpt) || null;
            this.optionCache.set(cacheKey, option);
          }

          if (option) {
            const nextToken = tokens[i + 1];
            parsed.options[option.name] =
              option.type === "boolean"
                ? true
                : nextToken && !this.isOption(nextToken)
                ? nextToken
                : true;
          }
        }
        i += shortOpts.length > 1 ? 1 : 2;
      } else {
        // This is either a command or an argument
        if (parsed.command.length === 0 && !parsed.args.length) {
          parsed.command.push(token);
        } else {
          parsed.args.push(token);
        }
        i++;
      }
    }

    return parsed;
  }

  private static isOption(token: string): boolean {
    return this.OPTION_REGEX.test(token);
  }

  private static parseOption(
    token: string,
    tokens: string[],
    index: number
  ): { name: string; value: string | boolean } {
    const longMatch = token.match(this.OPTION_REGEX);
    if (longMatch) {
      const [, name, value] = longMatch;
      if (!name) {
        throw new Error(`Invalid option format: ${token}`);
      }
      if (value !== undefined) {
        return { name, value };
      }
      // Check if next token is a value
      const nextToken = tokens[index + 1];
      if (nextToken && !this.isOption(nextToken)) {
        return { name, value: nextToken };
      }
      return { name, value: true };
    }

    const shortMatch = token.match(this.SHORT_OPTION_REGEX);
    if (shortMatch) {
      const name = shortMatch[1];
      if (!name) {
        throw new Error(`Invalid option format: ${token}`);
      }
      const nextToken = tokens[index + 1];
      if (nextToken && !this.isOption(nextToken)) {
        return { name, value: nextToken };
      }
      return { name, value: true };
    }

    throw new Error(`Invalid option format: ${token}`);
  }

  private static parseOptionValue(
    value: string | boolean,
    option: CLIOption
  ): any {
    if (typeof value === "boolean") {
      return value;
    }

    switch (option.type) {
      case "number":
        const num = parseFloat(value);
        if (isNaN(num)) {
          throw new Error(
            `Option ${option.name} expects a number, got: ${value}`
          );
        }
        return num;

      case "boolean":
        return value.toLowerCase() === "true" || value === "1";

      case "array":
        return value.split(",").map((item) => item.trim());

      case "string":
      default:
        if (option.choices && !option.choices.includes(value)) {
          throw new Error(
            `Option ${option.name} must be one of: ${option.choices.join(", ")}`
          );
        }
        return value;
    }
  }

  static validateArgs(parsed: ParsedArgs, args: CLIArgument[]): void {
    let argIndex = 0;

    for (const arg of args) {
      if (argIndex >= parsed.args.length) {
        if (arg.required) {
          throw new Error(`Missing required argument: ${arg.name}`);
        }
        break;
      }

      if (arg.variadic) {
        // All remaining args go to this variadic argument
        break;
      }

      argIndex++;
    }
  }

  static async validateOptions(parsed: ParsedArgs, options: CLIOption[], interactive: boolean = false): Promise<ParsedArgs> {
    const missingOptions: CLIOption[] = [];
    
    // First, collect all missing required options
    for (const option of options) {
      if (option.required && parsed.options[option.name] === undefined) {
        missingOptions.push(option);
      }
    }
    
    // If there are missing options and interactive mode is enabled, prompt for them
    if (missingOptions.length > 0 && interactive) {
      console.log("\nSome required options are missing. Please provide them:");
      
      for (const option of missingOptions) {
        const promptType = option.type === 'boolean' ? 'confirm' : 'text';
        const message = `${option.description} (--${option.name}${option.alias ? ` / -${option.alias}` : ''}):`;
        
        let initialValue;
        if (option.default !== undefined) {
          initialValue = option.default;
        } else if (option.type === 'number') {
          initialValue = 0;
        } else if (option.type === 'boolean') {
          initialValue = false;
        } else if (option.type === 'array') {
          initialValue = '';
        } else {
          initialValue = '';
        }
        
        const response = await prompts({
          type: promptType,
          name: 'value',
          message,
          initial: initialValue
        });
        
        if (response.value === undefined) {
          // User cancelled the prompt
          throw new Error(`Missing required option: --${option.name}${option.alias ? ` (-${option.alias})` : ''}`);
        }
        
        // Parse the value according to the option type
        parsed.options[option.name] = this.parseOptionValue(response.value, option);
      }
      
      return parsed;
    } else if (missingOptions.length > 0) {
      // If not in interactive mode, throw an error for the first missing option
      throw new Error(`Missing required option: --${missingOptions[0].name}${missingOptions[0].alias ? ` (-${missingOptions[0].alias})` : ''}`);
    }
    
    return parsed;
  }
}
