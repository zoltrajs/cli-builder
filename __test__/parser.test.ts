import { ZoltraCLIParser } from "../src/parser";
import { CLIOption, CLIArgument } from "../src/types";

describe("ZoltraCLIParser", () => {
  beforeEach(() => {
    ZoltraCLIParser.clearCache();
  });

  describe("parse", () => {
    it("should parse basic options", () => {
      const options: CLIOption[] = [
        {
          name: "verbose",
          alias: "v",
          type: "boolean",
          description: "Verbose output",
        },
        {
          name: "output",
          alias: "o",
          type: "string",
          description: "Output file",
        },
      ];

      const result = ZoltraCLIParser.parse(
        ["node", "cli", "--verbose", "--output", "file.txt"],
        options
      );

      expect(result.options.verbose).toBe(true);
      expect(result.options.output).toBe("file.txt");
    });

    it("should parse short options", () => {
      const options: CLIOption[] = [
        {
          name: "verbose",
          alias: "v",
          type: "boolean",
          description: "Verbose output",
        },
        {
          name: "output",
          alias: "o",
          type: "string",
          description: "Output file",
        },
      ];

      const result = ZoltraCLIParser.parse(
        ["node", "cli", "-v", "-o", "file.txt"],
        options
      );

      expect(result.options.verbose).toBe(true);
      expect(result.options.output).toBe("file.txt");
    });

    it("should parse combined short options", () => {
      const options: CLIOption[] = [
        {
          name: "verbose",
          alias: "v",
          type: "boolean",
          description: "Verbose output",
        },
        {
          name: "quiet",
          alias: "q",
          type: "boolean",
          description: "Quiet mode",
        },
      ];

      const result = ZoltraCLIParser.parse(["node", "cli", "-vq"], options);

      expect(result.options.verbose).toBe(true);
      expect(result.options.quiet).toBe(true);
    });

    it("should parse commands", () => {
      const result = ZoltraCLIParser.parse([
        "node",
        "cli",
        "build",
        "arg1",
        "arg2",
      ]);

      expect(result.command).toEqual(["build"]);
      expect(result.args).toEqual(["arg1", "arg2"]);
    });

    it("should handle option values with equals", () => {
      const options: CLIOption[] = [
        { name: "output", type: "string", description: "Output file" },
      ];

      const result = ZoltraCLIParser.parse(
        ["node", "cli", "--output=file.txt"],
        options
      );

      expect(result.options.output).toBe("file.txt");
    });

    it("should handle default values", () => {
      const options: CLIOption[] = [
        {
          name: "output",
          type: "string",
          description: "Output file",
          default: "./dist",
        },
      ];

      const result = ZoltraCLIParser.parse(["node", "cli"], options);

      expect(result.options.output).toBe("./dist");
    });

    it("should parse number options", () => {
      const options: CLIOption[] = [
        { name: "port", type: "number", description: "Port number" },
      ];

      const result = ZoltraCLIParser.parse(
        ["node", "cli", "--port", "3000"],
        options
      );

      expect(result.options.port).toBe(3000);
    });

    it("should parse array options", () => {
      const options: CLIOption[] = [
        { name: "files", type: "array", description: "Files to process" },
      ];

      const result = ZoltraCLIParser.parse(
        ["node", "cli", "--files", "file1.txt,file2.txt,file3.txt"],
        options
      );

      expect(result.options.files).toEqual([
        "file1.txt",
        "file2.txt",
        "file3.txt",
      ]);
    });
  });

  describe("validateArgs", () => {
    it("should validate required arguments", () => {
      const args: CLIArgument[] = [
        { name: "input", description: "Input file", required: true },
      ];

      const parsed = { command: [], options: {}, args: [] };

      expect(() => ZoltraCLIParser.validateArgs(parsed, args)).toThrow(
        "Missing required argument: input"
      );
    });

    it("should pass validation with required arguments", () => {
      const args: CLIArgument[] = [
        { name: "input", description: "Input file", required: true },
      ];

      const parsed = { command: [], options: {}, args: ["file.txt"] };

      expect(() => ZoltraCLIParser.validateArgs(parsed, args)).not.toThrow();
    });

    it("should handle variadic arguments", () => {
      const args: CLIArgument[] = [
        { name: "files", description: "Files", variadic: true },
      ];

      const parsed = {
        command: [],
        options: {},
        args: ["file1.txt", "file2.txt", "file3.txt"],
      };

      expect(() => ZoltraCLIParser.validateArgs(parsed, args)).not.toThrow();
    });
  });
});
