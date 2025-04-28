import { nanoid } from 'nanoid' // only works as version 3.3.4
import { ELanguage } from './types'

export function generateSlug(title: string, id: boolean = false) {
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    return id ? `${slug}-${nanoid(10)}` : slug
}

export const LANG_PORT: Partial<Record<ELanguage, number>> = {
    [ELanguage.NODE_JS]: 3000,
    [ELanguage.REACT_JS]: 5173,
    [ELanguage.REACT_TS]: 5173,
}