import { nanoid } from 'nanoid' // only works as version 3.3.4

export function generateSlug(title: string, id: boolean = false) {
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    return id ? `${slug}-${nanoid(10)}` : slug
}