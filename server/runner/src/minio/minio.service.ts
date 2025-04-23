import { Injectable } from "@nestjs/common";
import { InjectMinio } from "./minio.decorator";
import * as Minio from 'minio';
import path from "path";
import fs from 'fs';

@Injectable()
export class MinioService {
    protected _bucketName = 'cloud-ide';

    constructor(@InjectMinio() private readonly minioClient: Minio.Client) { }

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
        const bucket = process.env.MINIO_BUCKET!;
        const objects = await this.listObjects(bucket, key);
        for (const obj of objects) {
            const fileKey = obj.name;

            if (!fileKey) return;

            const outPath = path.join(localPath, fileKey.replace(key, ''));
            await this.createFolder(path.dirname(outPath));
            // getObject returns a stream.Readable

            if (!fileKey) return;

            const dataStream = await this.minioClient.getObject(bucket, fileKey);
            await new Promise<void>((resolve, reject) => {
                const writeStream = fs.createWriteStream(outPath);
                dataStream.pipe(writeStream)
                    .on('error', reject)
                    .on('finish', () => {
                        console.log(`Fetched ${fileKey} → ${outPath}`);
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
        content: string
    ): Promise<void> {
        const bucket = process.env.MINIO_BUCKET!;
        const objectName = `${key}${filePath}`;
        await this.minioClient.putObject(bucket, objectName, Buffer.from(content));
        console.log(`Uploaded to ${bucket}/${objectName}`);
    };
}