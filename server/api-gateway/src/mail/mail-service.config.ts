import { TemplateDelegate } from 'handlebars';

export interface ITemplates<T = any> {
    confirmation: TemplateDelegate<T>;
    resetPassword: TemplateDelegate<T>;
    twoFaOtp: TemplateDelegate<T>;
}