import { ipcMain, dialog, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import * as musicMetadata from 'music-metadata';

const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.wav', '.flac', '.ogg', '.m4a',
  '.aac', '.wma', '.aiff', '.aif', '.opus',
  '.webm', '.mka',
]);

interface AudioFileInfo {
  name: string;
  path: string;
  size: number;
  format: string;
  duration?: number;
}

interface ScanResult {
  files: AudioFileInfo[];
  totalFolders: number;
  errors: string[];
}

function isAudioFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return AUDIO_EXTENSIONS.has(ext);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

async function readDurationBatch(files: AudioFileInfo[], batchSize = 8): Promise<void> {
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file) => {
        try {
          const meta = await musicMetadata.parseFile(file.path, {
            duration: true,
            skipCovers: true,
            skipPostHeaders: true,
          });
          if (meta.format.duration && meta.format.duration > 0) {
            file.duration = meta.format.duration;
          }
        } catch {
          // leave duration undefined for unreadable files
        }
      })
    );
  }
}

function scanDirectoryRecursive(
  dirPath: string,
  results: AudioFileInfo[],
  errors: string[],
  folderCount: { value: number }
): void {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          folderCount.value++;
          scanDirectoryRecursive(fullPath, results, errors, folderCount);
        } else if (entry.isFile() && isAudioFile(fullPath)) {
          const stats = fs.statSync(fullPath);
          results.push({
            name: entry.name,
            path: fullPath,
            size: stats.size,
            format: path.extname(fullPath).toLowerCase().replace('.', ''),
          });
        }
      } catch (entryErr) {
        errors.push(`无法访问: ${fullPath}`);
      }
    }
  } catch (err) {
    errors.push(`无法读取目录: ${dirPath}`);
  }
}

export function registerFileScannerHandlers(): void {
  ipcMain.handle('dialog:selectFolder', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: '选择音效文件夹',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('file:scanFolder', async (_event, folderPath: string) => {
    const files: AudioFileInfo[] = [];
    const errors: string[] = [];
    const folderCount = { value: 0 };

    try {
      const stat = fs.statSync(folderPath);
      if (!stat.isDirectory()) {
        return { files: [], totalFolders: 0, errors: ['所选路径不是文件夹'] };
      }

      scanDirectoryRecursive(folderPath, files, errors, folderCount);

      // Sort by name
      files.sort((a, b) => a.name.localeCompare(b.name));

      // Read audio durations in parallel batches
      if (files.length > 0) {
        await readDurationBatch(files);
      }

      return {
        files,
        totalFolders: folderCount.value,
        errors,
      } as ScanResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        files: [],
        totalFolders: 0,
        errors: [`扫描失败: ${message}`],
      } as ScanResult;
    }
  });

  ipcMain.handle('file:getAudioDuration', async (_event, filePath: string) => {
    try {
      const meta = await musicMetadata.parseFile(filePath, {
        duration: true,
        skipCovers: true,
        skipPostHeaders: true,
      });
      return (meta.format.duration && meta.format.duration > 0)
        ? meta.format.duration
        : 0;
    } catch {
      return 0;
    }
  });
}
