import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { PageOptionsDto } from "../dto/pageOptions.dto";
import { PageMetaDto } from "../dto/pageMeta.dto";
import { PageDto } from "../dto/page.dto.";

export default async function paginatedData<T extends ObjectLiteral>(
    pageOptionsDto: PageOptionsDto,
    queryBuilder: SelectQueryBuilder<T>
) {
    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
}

export async function paginatedRawData<T extends ObjectLiteral>(
    pageOptionsDto: PageOptionsDto,
    queryBuilder: SelectQueryBuilder<T>
) {
    const itemCount = await queryBuilder.getCount();
    const data = await queryBuilder.getRawMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(data, pageMetaDto);
}