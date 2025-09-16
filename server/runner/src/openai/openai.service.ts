import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

type EmbedManyOpts = {
    model?: string;
    batchSize?: number;   // how many inputs to send per API call
    maxRetries?: number;  // retry attempts for transient errors
    baseBackoffMs?: number; // base backoff for exponential backoff
};

@Injectable()
export class OpenAIService {
    public openaiClient: OpenAI;
    private readonly logger = new Logger(OpenAIService.name);

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.openaiClient = new OpenAI({ apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY')! });
    }

    async embed(text: string) {
        const res = await this.openaiClient.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });

        return res.data[0].embedding;
    }

    /**
     * Embeds many texts in order, batching requests and retrying transient failures.
     * Returns an array of embeddings where result[i] corresponds to texts[i].
     *
     * Defaults tuned for common usage; override via opts.
     */
    async embedMany(
        texts: string[],
        opts?: EmbedManyOpts
    ): Promise<number[][]> {
        if (!Array.isArray(texts)) throw new TypeError('texts must be an array of strings');
        if (texts.length === 0) return [];

        const model = opts?.model ?? 'text-embedding-3-small';
        const batchSize = opts?.batchSize ?? 32;
        const maxRetries = opts?.maxRetries ?? 3;
        const baseBackoffMs = opts?.baseBackoffMs ?? 500;

        const results: number[][] = [];
        // split texts into batches but keep global order
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);

            // retry loop with exponential backoff + jitter
            let attempt = 0;
            while (true) {
                try {
                    const resp = await this.openaiClient.embeddings.create({
                        model,
                        input: batch,
                    });

                    // validate response
                    if (!resp?.data || !Array.isArray(resp.data) || resp.data.length !== batch.length) {
                        // defensive: sometimes providers return unexpected shape — surface a helpful error
                        this.logger.error(`embedMany: unexpected response shape. expected ${batch.length} embeddings, got ${resp?.data?.length}`);
                        throw new Error('embedMany: invalid response from embeddings API');
                    }

                    // append embeddings preserving order
                    for (const item of resp.data) {
                        const emb = item?.embedding;
                        if (!Array.isArray(emb)) {
                            throw new Error('embedMany: embedding item missing or malformed');
                        }
                        // coerce numeric strings to numbers if any provider returns such (defensive)
                        const normalized = emb.map(e => (typeof e === 'string' ? Number(e) : e)) as number[];
                        results.push(normalized);
                    }

                    // success -> break retry loop and move to next batch
                    break;
                } catch (err: any) {
                    attempt++;
                    // if final attempt, rethrow
                    if (attempt > maxRetries) {
                        this.logger.error(`embedMany: failed after ${attempt} attempts`, err?.message ?? err);
                        throw err;
                    }
                    // backoff with jitter
                    const backoff = Math.round(baseBackoffMs * Math.pow(2, attempt - 1) + Math.random() * 300);
                    this.logger.warn(`embedMany: batch failed (attempt ${attempt}/${maxRetries}), backing off ${backoff}ms — ${err?.message ?? err}`);
                    await sleep(backoff);
                    // loop and retry
                }
            }
        }

        return results;
    }
}
