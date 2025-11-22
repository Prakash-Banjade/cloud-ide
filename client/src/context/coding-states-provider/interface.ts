import { RemoteUser } from "@/components/code/active-users";
import { TFileItem, TreeItem } from "@/types/tree.types";
import { EPermission, TProject } from "@/types/types";
import { ImperativePanelHandle } from "react-resizable-panels";
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

export enum EPanel {
    FileTree = "fileTree",
    Terminal = "terminal",
    Preview = "preview",
    AiChat = "aiChat"
}

export interface CodingStatesContextType {
    fileStructure: TreeItem[];
    setFileStructure: React.Dispatch<React.SetStateAction<TreeItem[]>>;
    selectedFile: TFileItem | undefined;
    setSelectedFile: React.Dispatch<React.SetStateAction<TFileItem | undefined>>;
    selectedItem: TreeItem | undefined;
    setSelectedItem: React.Dispatch<React.SetStateAction<TreeItem | undefined>>;
    openedFiles: TFileItem[];
    setOpenedFiles: React.Dispatch<React.SetStateAction<TFileItem[]>>;
    isSyncing: boolean;
    setIsSyncing: (value: boolean) => void;
    editorInstance: IStandaloneCodeEditor | null,
    setEditorInstance: React.Dispatch<React.SetStateAction<IStandaloneCodeEditor | null>>
    project: TProject | undefined;
    permission: EPermission;
    isOwner: boolean;
    mruFiles: TFileItem[];
    setMruFiles: React.Dispatch<React.SetStateAction<TFileItem[]>>;
    treeLoaded: boolean;
    setTreeLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    mutedUsers: string[];
    setMutedUsers: React.Dispatch<React.SetStateAction<string[]>>;
    observedUser: RemoteUser | null;
    setObservedUser: React.Dispatch<React.SetStateAction<RemoteUser | null>>
    objectsList: string[];
    setObjectsList: React.Dispatch<React.SetStateAction<string[]>>;
    showPanel: Record<EPanel, boolean>;
    togglePanel: (panel: EPanel, open: boolean) => void
    terminalPanelRef: React.RefObject<ImperativePanelHandle | null>;
    previewPanelRef: React.RefObject<ImperativePanelHandle | null>;
    aiChatPanelRef: React.RefObject<ImperativePanelHandle | null>;
    treePanelRef: React.RefObject<ImperativePanelHandle | null>;
}

export type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor