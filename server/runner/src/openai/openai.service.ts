import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
    public openaiClient: OpenAI;

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
}
