import * as Joi from 'joi';

export const envSchema = Joi.object({
    DATABASE_URL: Joi.string().uri().required(), // Validates that it's a valid URL
    DB_SYNCHRONIZE: Joi.string().valid('true', 'false').required(), // Validates that it's a boolean

    REDIS_URL: Joi.string().uri().required(), // Validates that it's a valid URL

    ACCESS_TOKEN_SECRET: Joi.string().required(),
    ACCESS_TOKEN_EXPIRATION_SEC: Joi.string()
        .pattern(/^\d+$/, { name: 'number' }) // Ensure it matches a numeric pattern
        .messages({ 'string.pattern.name': 'Access token expiration must be a number' })
        .required(),
    REFRESH_TOKEN_SECRET: Joi.string().required(),
    REFRESH_TOKEN_EXPIRATION_SEC: Joi.string()
        .pattern(/^\d+$/, { name: 'number' })
        .messages({ 'string.pattern.name': 'Refresh token expiration must be a number' })
        .required(),

    COOKIE_SECRET: Joi.string().required(),

    EMAIL_VERIFICATION_SECRET: Joi.string().required(),
    EMAIL_VERIFICATION_EXPIRATION_SEC: Joi.string()
        .pattern(/^\d+$/, { name: 'number' })
        .messages({ 'string.pattern.name': 'Email verification expiration must be a number' })
        .required(),

    FORGOT_PASSWORD_SECRET: Joi.string().required(),
    FORGOT_PASSWORD_EXPIRATION_SEC: Joi.string()
        .pattern(/^\d+$/, { name: 'number' })
        .messages({ 'string.pattern.name': 'Forgot password expiration must be a number' })
        .required(),

    SUDO_ACCESS_TOKEN_SECRET: Joi.string().required(),
    SUDO_ACCESS_TOKEN_EXPIRATION_SEC: Joi.string()
        .pattern(/^\d+$/, { name: 'number' })
        .messages({ 'string.pattern.name': 'Sudo access token expiration must be a number' })
        .required(),

    TWOFACTOR_VERIFICATION_SECRET: Joi.string().required(),
    TWOFACTOR_VERIFICATION_EXPIRATION_SEC: Joi.string()
        .pattern(/^\d+$/, { name: 'number' })
        .messages({ 'string.pattern.name': 'Two-factor verification expiration must be a number' })
        .required(),

    CLIENT_URL: Joi.string().uri().required(), // Client URL should be a valid URL
    BACKEND_URL: Joi.string().uri().required(),
    CLIENT_DOMAIN: Joi.string().required(),

    AES_KEY: Joi.string().required(), // AES key validation, assuming it's a string
    AES_IV: Joi.string().required(), // AES IV should also be a string

    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(), // Restrict NODE_ENV to specific values

});
