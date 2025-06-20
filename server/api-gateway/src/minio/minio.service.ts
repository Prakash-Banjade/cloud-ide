import { Injectable } from "@nestjs/common";
import { InjectMinio } from "./minio.decorator";
import * as Minio from 'minio';

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

    async removePrefix(prefix: string): Promise<void> {
        // list all matching objects recursively
        const objects = this.minioClient.listObjectsV2(this._bucketName, prefix, true);
        const toDelete = [];
        for await (const obj of objects) {
            toDelete.push(obj.name! as never);
        }
        // batch remove
        await this.minioClient.removeObjects(this._bucketName, toDelete.map(n => n));  // removeObjects :contentReference[oaicite:9]{index=9}
    }
}