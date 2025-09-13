import { MinioService } from "src/minio/minio.service";
import { FileSystemService } from "./file-system.service";
import { WORKSPACE_PATH } from "src/CONSTANTS";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

@Injectable()
export class FileSystemCRUDService {
    private replId: string;

    constructor(
        private readonly minioService: MinioService,
        private readonly fileSystemService: FileSystemService,
        private readonly configService: ConfigService,
    ) {
        this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
    }

    async createItem(payload: {
        path: string,
        type: 'file' | 'dir',
        content?: string
    }): Promise<{ success: boolean, error: string | null }> {
        try {
            const { path, type, content = "" } = payload;
            const fullPath = `${WORKSPACE_PATH}${path}`;

            if (type === 'dir') {
                await this.fileSystemService.createDir(fullPath);
                await this.minioService.ensurePrefix(`code/${this.replId}${path}`);
            } else {
                await this.fileSystemService.createFile(fullPath, content);
                await this.minioService.saveToMinio(`code/${this.replId}`, path, content);
            }

            return { success: true, error: null };
        } catch (err) {
            console.error('createItem failed', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Delete a file or directory (recursively) at payload.path.
     */
    async deleteItem(payload: { path: string, type: 'file' | 'dir' }): Promise<boolean> {
        try {
            const { path, type } = payload;
            const fullPath = `${WORKSPACE_PATH}${path}`;

            // delete on disk (recursive for dirs)
            await this.fileSystemService.deletePath(fullPath);

            // remove from Minio: if it's a folder, remove all objects under that prefix
            if (type === 'dir') {
                await this.minioService.removePrefix(`code/${this.replId}${path}`);
            } else {
                await this.minioService.removeObject(`code/${this.replId}`, path);
            }

            return true;
        } catch (err) {
            console.error('deleteItem failed', err);
            return false;
        }
    }

    /**
     * Rename or move a file or directory.
     * Assumes payload contains both oldPath and newPath.
     */
    async renameItem(payload: { oldPath: string, newPath: string, type: 'file' | 'dir' }): Promise<{ success: boolean, error: string | null }> {
        try {
            const { oldPath, newPath, type } = payload;
            const fullOld = `${WORKSPACE_PATH}${oldPath}`;
            const fullNew = `${WORKSPACE_PATH}${newPath}`;

            // rename on disk
            await this.fileSystemService.renamePath(fullOld, fullNew);

            // mirror in Minio: move each object from old prefix to new prefix

            if (type === 'dir') {
                // ensure trailing slash so listObjectsV2 will enumerate children :contentReference[oaicite:2]{index=2}
                const srcPrefix = `code/${this.replId}${oldPath.endsWith('/') ? oldPath : oldPath + '/'}`;
                const dstPrefix = `code/${this.replId}${newPath.endsWith('/') ? newPath : newPath + '/'}`;
                await this.minioService.movePrefix(srcPrefix, dstPrefix);
            } else {
                await this.minioService.copyObject(`code/${this.replId}`, oldPath, `code/${this.replId}`, newPath);
                await this.minioService.removeObject(`code/${this.replId}`, oldPath);
            }

            return { success: true, error: null };
        } catch (err) {
            console.error('renameItem failed', err);
            return { success: false, error: err.message };
        }
    }
}