import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify/types/request';
import { ENTITY_MANAGER_KEY } from './transaction.interceptor';

export class BaseRepository {
    constructor(private dataSource: DataSource, private request: FastifyRequest) { }

    protected getRepository<T extends ObjectLiteral>(entityCls: new () => T): Repository<T> {
        const entityManager: EntityManager =
            this.request[ENTITY_MANAGER_KEY] ?? this.dataSource.manager;
        return entityManager.getRepository(entityCls);
    }
}