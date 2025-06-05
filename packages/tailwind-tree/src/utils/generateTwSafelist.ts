import chalk from "chalk";
import fs from "fs";
import path from "path";
import { twTree } from "./twTree";
import JSON5 from "json5";
import { ROOT_PATH } from "../constants";

const isModule = ROOT_PATH.includes("dist");
// Define the path to your generated styles file
const generatedTwSafelistPath = path.resolve(ROOT_PATH, isModule ? "tw-safelist.js" : "../tw-safelist.ts");

// Function to check if the generated twSafelist file exists
const checkTwSafelistFileExists = (filePath: string): void => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} does not exist`);
  }
};

// Function to collect used styles from source files
const collectUsedClasses = (sourceFiles: string[]): Set<string> => {
  const usedClasses = new Set<string>();
  const twTreeRegex = /twTree\s*\(\s*(\[(?:[\s\S]*?)\])\s*\)/g; // Regex to match styles([...])

  sourceFiles.forEach((filePath) => {
    const data = fs.readFileSync(filePath, "utf8");
    let match;
    while ((match = twTreeRegex.exec(data)) !== null) {
      const args = JSON5.parse(match[1]);
      twTree(args)
        .split(" ")
        .forEach((arg) => usedClasses.add(arg));
    }
  });

  return usedClasses;
};

// Function to update the twSafelist file with filtered data
const updateTwSafelistFile = (filePath: string, filteredTwSafelist: Array<string>): void => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    const updatedTwSafelist = data.replace(/(const twSafelist =)[\s\S]*?(;)/, `$1 ${JSON.stringify(filteredTwSafelist, null, 4)}$2`);

    fs.writeFile(filePath, updatedTwSafelist, "utf8", (err) => {
      if (err) {
        console.error("Error writing updated twSafelist:", err);
        return;
      }
      console.log(chalk.greenBright("tailwind-tree compile completed!"));
    });
  });
};

// Function to recursively get all .tsx and .js files in a directory
const getAllSourceFiles = (dir: string): string[] => {
  let results: string[] = [];
  const list = (fs.readdirSync(dir) || []).filter((d) => !["node_modules", "dist"].includes(d));
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    // if(["node_modules"].includes(filePath))
    if (stat && stat.isDirectory()) {
      // Recursively get files from subdirectories
      results = results.concat(getAllSourceFiles(filePath));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts") || file.endsWith(".js")) {
      // Add .tsx and .js files to the results
      results.push(filePath);
    }
  });

  return results;
};

// Main function to execute the script
export const generateTwSafelist = async () => {
  try {
    checkTwSafelistFileExists(generatedTwSafelistPath);

    // Get all .tsx and .js files in the project directory
    const sourceFiles = getAllSourceFiles(process.cwd());
    const usedClasses = collectUsedClasses(sourceFiles);
    updateTwSafelistFile(generatedTwSafelistPath, [...usedClasses]);
  } catch (error) {
    console.error("Error loading generated twSafelist:", error);
    process.exit(1);
  }
};
