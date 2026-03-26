/**
 * File Operations — Provides file and directory operations
 *
 * Encapsulates common file system operations:
 * - File copying
 * - Directory copying (recursive)
 * - File reading/writing
 * - Existence checks
 *
 * @class FileOperations
 */
import * as fs from 'fs';
import * as path from 'path';

export class FileOperations {
  /**
   * Create a FileOperations instance
   */
  constructor() {}

  /**
   * Copy a file from source to destination
   * @param src - Source file path
   * @param dest - Destination file path
   * @throws {Error} If source file doesn't exist or copy fails
   */
  copyFile(src: string, dest: string): void {
    if (!this.fileExists(src)) {
      throw new Error(`Source file does not exist: ${src}`);
    }

    // Ensure destination directory exists
    const destDir = path.dirname(dest);
    this.ensureDirectory(destDir);

    fs.copyFileSync(src, dest);
  }

  /**
   * Copy a directory recursively from source to destination
   * @param src - Source directory path
   * @param dest - Destination directory path
   * @throws {Error} If source directory doesn't exist or copy fails
   */
  copyDirectory(src: string, dest: string): void {
    if (!this.directoryExists(src)) {
      throw new Error(`Source directory does not exist: ${src}`);
    }

    // Ensure destination directory exists
    this.ensureDirectory(dest);

    // Read source directory contents
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        this.copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Read a file and return its contents
   * @param filePath - Path to the file
   * @returns File contents as string
   * @throws {Error} If file doesn't exist or cannot be read
   */
  readFile(filePath: string): string {
    if (!this.fileExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Write content to a file
   * @param filePath - Path to the file
   * @param content - Content to write
   * @throws {Error} If file cannot be written
   */
  writeFile(filePath: string, content: string): void {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    this.ensureDirectory(dir);

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Check if a file exists
   * @param filePath - Path to the file
   * @returns True if file exists, false otherwise
   */
  fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory exists
   * @param dirPath - Path to the directory
   * @returns True if directory exists, false otherwise
   */
  directoryExists(dirPath: string): boolean {
    try {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   * @param dirPath - Path to the directory
   * @throws {Error} If directory cannot be created
   */
  ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Read and parse a JSON file
   * @param filePath - Path to the JSON file
   * @returns Parsed JSON object
   * @throws {Error} If file doesn't exist or contains invalid JSON
   */
  static readJsonFile<T = any>(filePath: string): Promise<T> {
    return import('fs/promises').then(({ readFile }) =>
      readFile(filePath, 'utf-8').then((content) => JSON.parse(content))
    );
  }

  /**
   * Write an object to a JSON file
   * @param filePath - Path to the JSON file
   * @param data - Data to write
   * @throws {Error} If file cannot be written
   */
  static async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    const { writeFile, mkdir } = await import('fs/promises');
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
