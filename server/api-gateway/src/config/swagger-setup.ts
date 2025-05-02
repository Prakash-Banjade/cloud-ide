import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Tokens } from "src/common/CONSTANTS";

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Qubide - Cloud IDE')
        .setDescription(
            `“Qubide – Cloud IDE” is a cloud‑native Integrated Development Environment (IDE) 
            designed to meet the growing demand for flexible, accessible, and secure development 
            environments.`
        )
        .setVersion('1.0')
        .addServer(process.env.BACKEND_URL!)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            }
        )
        .addCookieAuth(Tokens.REFRESH_TOKEN_COOKIE_NAME)
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document, {
        jsonDocumentUrl: 'docs/json',
        customSiteTitle: 'Qubide - Cloud IDE',
        customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.js',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js',
        ],
        customCssUrl: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.css',
        ],

    });
}