import * as crypto from 'node:crypto'

export function generateSlug(title: string, id: boolean = false) {
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    const uniqueId = crypto.randomBytes(8).toString('hex').toUpperCase()

    return id ? `${slug}-${uniqueId}` : slug
}

export function generateDeviceId(userAgent: string | undefined, ipAddress: string): string {
    return crypto.createHash('sha256').update(`${userAgent}-${ipAddress}`).digest('hex');
}


/**
 * @description Returns an array of strings from a string or an array of strings
 * @param {string | string[] | undefined} value - The input value to be processed.
 * @returns {string[]} An array of strings.
 */
export function getArrayQueryParam(value: string | string[] | undefined): string[] {
    return Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
}
