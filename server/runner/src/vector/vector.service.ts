import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from 'src/openai/openai.service';

@Injectable()
export class VectorService {
    pool: Pool;
    table: string;

    constructor(
        private readonly openai: OpenAIService,
        private readonly configService: ConfigService
    ) {
        this.pool = new Pool({ connectionString: this.configService.getOrThrow<string>('DATABASE_URL') });
        this.table = this.configService.get<string>('VECTOR_TABLE') || 'repo_embeddings';
    }

    async ensureTable() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS ${this.table} (
                id serial primary key,
                project_id text,
                path text,
                content text,
                embedding vector(1536)
            );
        `);
        await this.pool.query(`CREATE INDEX IF NOT EXISTS ON ${this.table} USING ivfflat (embedding) with (lists = 100);`);
    }

    async upsertChunk(projectId: string, path: string, content: string) {
        const emb = await this.openai.embed(content);
        await this.pool.query(
            `INSERT INTO ${this.table} (project_id, path, content, embedding) VALUES ($1,$2,$3,$4)`,
            [projectId, path, content, emb]
        );
    }

    async semanticSearch(projectId: string, query: string, topK = 5) {
        const qEmb = await this.openai.embed(query);
        const res = await this.pool.query(
            `SELECT path, content, 1 - (embedding <#> $1) as similarity FROM ${this.table} WHERE project_id = $2 ORDER BY embedding <#> $1 LIMIT $3`,
            [qEmb, projectId, topK]
        );
        return res.rows.map(r => ({ path: r.path, content: r.content, score: r.similarity }));
    }
}
