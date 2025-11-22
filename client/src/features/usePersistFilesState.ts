import { useCodingStates } from "@/context/coding-states-provider";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import cookie from 'js-cookie';
import { z } from "zod";
import { findItem } from "@/app/code/[replId]/fns/file-manager-fns";
import { EItemType, TFileItem } from "@/types/tree.types";
import { SocketEvents } from "@/lib/CONSTANTS";
import { useSocket } from "@/context/socket-provider";

export function usePersistFilesState() {
    const { replId } = useParams();
    const { treeLoaded, setOpenedFiles, setMruFiles, fileStructure, setSelectedFile, setSelectedItem, selectedFile, openedFiles, mruFiles } = useCodingStates();
    const { socket } = useSocket();

    /**
     * Restore state from cookies once the file tree is loaded
     */
    useEffect(() => {
        if (!treeLoaded) return;

        const openedFiles = cookie.get(`openedFiles:${replId}`);
        const mruFiles = cookie.get(`mruFiles:${replId}`);
        const selectedFile = cookie.get(`selectedFile:${replId}`);

        try {
            if (openedFiles) {
                const parsedData = JSON.parse(openedFiles);

                const { data, success } = z.array(z.string()).safeParse(parsedData);

                if (success) {
                    setOpenedFiles(data.map(f => findItem(fileStructure, f, socket ?? undefined)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (mruFiles) {
                const parsedData = JSON.parse(mruFiles);

                const { data, success } = z.array(z.string()).safeParse(parsedData);

                if (success) {
                    setMruFiles(data.map(f => findItem(fileStructure, f, socket ?? undefined)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (selectedFile) {
                const file = findItem(fileStructure, selectedFile, socket ?? undefined);

                if (file && file.type === EItemType.FILE) {
                    socket?.emit(SocketEvents.FETCH_CONTENT, { path: file.path }, (data: string) => { // load data
                        file.content = data;
                        setSelectedFile(file);
                        setSelectedItem(file);
                    });
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, [treeLoaded])

    /**
     * Persist opened files to cookies
     */
    useEffect(() => {
        if (!treeLoaded) return;
        cookie.set(`openedFiles:${replId}`, JSON.stringify(openedFiles.map(f => f.path)), { expires: 7 });
    }, [openedFiles]);

    /**
     * Persist MRU files to cookies
     */
    useEffect(() => {
        if (!treeLoaded) return;
        cookie.set(`mruFiles:${replId}`, JSON.stringify(mruFiles.map(f => f.path)), { expires: 7 });
    }, [mruFiles]);

    /**
     * Persist selected file to cookies
     */
    useEffect(() => {
        if (!selectedFile) return;
        cookie.set(`selectedFile:${replId}`, selectedFile?.path, { expires: 7 });
    }, [selectedFile]);
}