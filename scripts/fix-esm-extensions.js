import fs from "fs";
import path from "path";

const esmDir = path.resolve("dist/esm");

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");

  // Match import/export paths like './foo' or '../bar'
  code = code.replace(
    /((?:import|export)\s.+?from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g,
    (match, before, importPath, after) => {
      if (
        importPath.endsWith(".js") ||
        importPath.endsWith(".json") ||
        importPath.endsWith(".cjs") ||
        importPath.endsWith(".mjs")
      ) {
        return before + importPath + after; // already has extension
      }
      return before + importPath + ".js" + after;
    }
  );

  fs.writeFileSync(filePath, code, "utf8");
}

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".js")) {
      fixFile(fullPath);
    }
  }
}

walk(esmDir);
console.log("✅ Fixed ESM imports/exports to include .js extensions");
