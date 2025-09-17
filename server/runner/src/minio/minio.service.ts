import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectMinio } from "./minio.decorator";
import * as Minio from 'minio';
import path from "path";
import fs from 'fs';
import { Readable } from "stream";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MinioService implements OnModuleInit {
    protected _bucketName = 'cloud-ide';
    replId: string;

    private objectsList = new Set<string>();

    constructor(
        @InjectMinio() private readonly minioClient: Minio.Client,
        private readonly configService: ConfigService
    ) {
        this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
    }

    async onModuleInit() {
        const objects = await this.listObjects(this._bucketName, `code/${this.replId}/`);

        for (const obj of objects) {
            const name = obj.name?.replace(`code/${this.replId}`, '');
            if (name?.endsWith('.keep')) continue;
            if (name) this.objectsList.add(name);
        }
    }

    getObjectList() {
        return Array.from(this.objectsList);
    }

    async listObjects(
        bucket: string,
        prefix: string
    ): Promise<Minio.BucketItem[]> {
        return new Promise((resolve, reject) => {
            const objs: Minio.BucketItem[] = [];
            const stream = this.minioClient.listObjectsV2(bucket, prefix, true);
            stream.on('data', (obj) => objs.push(obj));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(objs));
        });
    }

    async fetchMinioFolder(
        key: string,
        localPath: string
    ): Promise<void> {
        const objects = await this.listObjects(this._bucketName, key);
        for (const obj of objects) {
            const fileKey = obj.name;

            if (!fileKey) return;

            const outPath = path.join(localPath, fileKey.replace(key, ''));
            await this.createFolder(path.dirname(outPath));
            // getObject returns a stream.Readable

            if (!fileKey) return;

            const dataStream = await this.minioClient.getObject(this._bucketName, fileKey);
            await new Promise<void>((resolve, reject) => {
                const writeStream = fs.createWriteStream(outPath);
                dataStream.pipe(writeStream)
                    .on('error', reject)
                    .on('finish', () => {
                        resolve();
                    });
            });
        }
    };

    createFolder(dirName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.mkdir(dirName, { recursive: true }, (err) =>
                err ? reject(err) : resolve()
            );
        });
    }

    async copyMinioFolder(
        sourcePrefix: string,
        destinationPrefix: string
    ): Promise<void> {
        const objects = await this.listObjects(this._bucketName, sourcePrefix);
        if (objects.length === 0) return;

        await Promise.all(
            objects.map(async (object) => {
                const destinationKey = object.name?.replace(sourcePrefix, destinationPrefix);
                const src = `/${this._bucketName}/${object.name}`;

                if (!destinationKey) return;

                await this.minioClient.copyObject(this._bucketName, destinationKey, src);
            })
        );
    }

    async saveToMinio(
        key: string,
        filePath: string,
        content: string | Buffer<ArrayBufferLike> | Readable
    ): Promise<void> {
        const objectName = `${key}${filePath}`;
        await this.minioClient.putObject(this._bucketName, objectName, typeof content === 'string' ? Buffer.from(content) : content);
        this.objectsList.add(objectName);
        console.log(`Uploaded to ${this._bucketName}/${objectName}`);
    };

    /** (Optional) ensure a “directory marker” so prefix shows up in some UIs */
    async ensurePrefix(prefix: string): Promise<void> {
        // e.g. write zero-byte object at prefix + '.keep'
        await this.minioClient.putObject(this._bucketName, `${prefix}.keep`, Buffer.alloc(0));
        console.log(`Prefix created at ${this._bucketName}/${prefix}.keep`);
    }

    /** Remove a single object */
    async removeObject(prefix: string, key: string): Promise<void> {
        const objectName = `${prefix}${key}`;
        await this.minioClient.removeObject(this._bucketName, objectName);  // removeObject API :contentReference[oaicite:8]{index=8}
        this.objectsList.delete(objectName);
    }

    /** Remove all objects under a prefix */
    async removePrefix(prefix: string): Promise<void> {
        // list all matching objects recursively
        const objects = this.minioClient.listObjectsV2(this._bucketName, prefix, true);
        const toDelete = [];
        for await (const obj of objects) {
            toDelete.push(obj.name! as never);
        }
        // batch remove
        await this.minioClient.removeObjects(this._bucketName, toDelete.map(n => n));  // removeObjects :contentReference[oaicite:9]{index=9}
        const newObjectLists = new Set([...this.objectsList].filter(path => !path.includes(prefix)));
        this.objectsList = newObjectLists;
        console.log(`Prefix removed at ${this._bucketName}/${prefix}`);
    }

    /** Copy one object */
    async copyObject(
        srcPrefix: string, srcKey: string,
        dstPrefix: string, dstKey: string
    ): Promise<void> {
        const src = `${srcPrefix}${srcKey}`;
        const dst = `${dstPrefix}${dstKey}`;
        await this.minioClient.copyObject(
            this._bucketName,
            dst,
            `/${this._bucketName}/${src}`                              // copyObject API :contentReference[oaicite:10]{index=10}
        );
        this.objectsList = new Set([...this.objectsList].map(path => path.replace(src, dst)));
    }

    /** Move all objects under one prefix to another */
    async movePrefix(oldPrefix: string, newPrefix: string): Promise<void> {
        // list & copy each, then delete old prefix :contentReference[oaicite:11]{index=11}
        const objects = this.minioClient.listObjectsV2(this._bucketName, oldPrefix, true);
        for await (const obj of objects) {
            const rel = obj.name!.replace(oldPrefix, '');
            await this.copyObject(oldPrefix, rel, newPrefix, rel);
        }
        await this.removePrefix(oldPrefix);
        this.objectsList = new Set([...this.objectsList].map(path => path.replace(oldPrefix, newPrefix)));
    }
}