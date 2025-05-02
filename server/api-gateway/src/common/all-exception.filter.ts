import { Catch, ArgumentsHost, HttpStatus, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { QueryFailedError } from "typeorm";
import { ValidationError } from 'class-validator'
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";

type ErrorResponse = {
    statusCode: number,
    timeStamp: string,
    path: string,
    message: string | object,
    type: string,
}

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>()
        const request = ctx.getRequest<FastifyRequest>()

        const errResponse: ErrorResponse = {
            statusCode: 500,
            timeStamp: new Date().toISOString(),
            path: request.url,
            message: '',
            type: 'Error',
        }

        if (exception instanceof HttpException) { // due to http error
            errResponse.statusCode = exception.getStatus()
            errResponse.message = exception.getResponse();
            errResponse.type = 'HttpException'
        } else if (exception instanceof QueryFailedError) { // from type orm
            errResponse.statusCode = 422
            errResponse.message = exception.message.replaceAll('\n', ' ')
            errResponse.type = 'QueryFailedError'
        } else if (exception instanceof ValidationError) { // from class-validator
            errResponse.statusCode = HttpStatus.BAD_REQUEST;
            errResponse.message = exception.constraints ? exception.constraints[Object.keys(exception.constraints)[0]] : exception
            errResponse.type = 'ValidationError'
        } else if (exception instanceof TypeError || exception instanceof Error) { // from type script
            errResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errResponse.message = exception.message;
            errResponse.type = 'TypeError | Error'
        } else { // others
            errResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errResponse.message = 'Internal Server Error'
            errResponse.type = 'Others'
        }

        console.log(
            request.method,
            errResponse.path,
            errResponse.type,
            errResponse.message,
        );

        if (typeof errResponse.message === 'string' && errResponse.message.includes('foreign key constraint fails')) {
            errResponse.message = "You cannot delete this record because it is referenced by other records"
        }

        response
            .status(errResponse.statusCode)
            .send(errResponse);

        super.catch(exception, host);
    }
}