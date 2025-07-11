export enum EItemType {
    FILE = 'file',
    DIR = 'dir'
}

interface ItemCommonProps {
    name: string,
    path: string,
}

export interface TFileItem extends ItemCommonProps {
    type: EItemType.FILE
    content: string | undefined
    language?: string
}

export interface TFolderItem extends ItemCommonProps {
    type: EItemType.DIR
    expanded?: boolean
    children: (TFileItem | TFolderItem)[]
}

export type TreeItem = (TFileItem | TFolderItem);