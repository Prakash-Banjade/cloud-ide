import * as Joi from 'joi';

export const envSchema = Joi.object({
    DATABASE_URL: Joi.string().uri().required(), // Validates that it's a valid URL

    REDIS_URL: Joi.string().uri().required(), // Validates that it's a valid URL

    ACCESS_TOKEN_SECRET: Joi.string().required(),
    ACCESS_TOKEN_EXPIRATION_SEC: Joi.string().required(),
    REFRESH_TOKEN_SECRET: Joi.string().required(),
    REFRESH_TOKEN_EXPIRATION_SEC: Joi.string().required(),

    COOKIE_SECRET: Joi.string().required(),

    EMAIL_VERIFICATION_SECRET: Joi.string().required(),
    EMAIL_VERIFICATION_EXPIRATION_SEC: Joi.string().required(),

    FORGOT_PASSWORD_SECRET: Joi.string().required(),
    FORGOT_PASSWORD_EXPIRATION_SEC: Joi.string().required(),

    SUDO_ACCESS_TOKEN_SECRET: Joi.string().required(),
    SUDO_ACCESS_TOKEN_EXPIRATION_SEC: Joi.string().required(),

    TWOFACTOR_VERIFICATION_SECRET: Joi.string().required(),
    TWOFACTOR_VERIFICATION_EXPIRATION_SEC: Joi.string().required(),

    CLIENT_URL: Joi.string().uri().required(), // Client URL should be a valid URL
    BACKEND_URL: Joi.string().uri().required(),
    CLIENT_DOMAIN: Joi.string().required(),

    AES_KEY: Joi.string().required(), // AES key validation, assuming it's a string
    AES_IV: Joi.string().required(), // AES IV should also be a string

    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(), // Restrict NODE_ENV to specific values
});
