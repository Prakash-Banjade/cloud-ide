import { DataSource } from 'typeorm';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
    imports: [],
    providers: [
        {
            provide: DataSource,
            inject: [],
            useFactory: async () => {
                try {
                    const dataSource = new DataSource({
                        type: 'postgres',
                        username: process.env.PG_USER,
                        password: process.env.PG_PWD,
                        database: process.env.PG_DB,
                        host: process.env.PG_HOST,
                        entities: [`${__dirname}/../**/**.entity{.ts,.js}`],
                        synchronize: process.env.DB_SYNCHRONIZE === 'true',
                        // logger: 'advanced-console',
                        // logging: 'all'
                    });
                    await dataSource.initialize();
                    console.log('Database connected successfully');
                    return dataSource;
                } catch (error) {
                    console.log('Error connecting to database');
                    throw error;
                }
            },
        },
    ],
    exports: [DataSource],
})
export class TypeOrmModule { }