// import { buildFileTree, File, RemoteFile } from "@/lib/file-manager";
// import Editor from "@monaco-editor/react";
// import { Socket } from "socket.io-client";

// import { useEffect, useMemo } from "react";

// // credits - https://codesandbox.io/s/monaco-tree-pec7u
// export const CodeEditor = ({
//     files,
//     onSelect,
//     selectedFile,
//     socket
// }: {
//     files: RemoteFile[];
//     onSelect: (file: File) => void;
//     selectedFile: File | undefined;
//     socket: Socket;
// }) => {
//     const rootDir = useMemo(() => {
//         return buildFileTree(files);
//     }, [files]);

//     useEffect(() => {
//         if (!selectedFile) {
//             onSelect(rootDir.files[0])
//         }
//     }, [selectedFile])

//     return (
//         <section className="flex">
//             <aside className="h-screen w-[250px] pt-2 border-r border-gray-700">
//                 {/* <FileTree
//                     rootDir={rootDir}
//                     selectedFile={selectedFile}
//                     onSelect={onSelect}
//                 /> */}
//             </aside>
//             <Code socket={socket} selectedFile={selectedFile} />
//         </section>
//     );
// };

// export const Code = ({ selectedFile, socket }: { selectedFile: File | undefined, socket: Socket }) => {
//     if (!selectedFile) return null

//     const code = selectedFile.content
//     let language = selectedFile.name.split('.').pop()

//     if (language === "js" || language === "jsx")
//         language = "javascript";
//     else if (language === "ts" || language === "tsx")
//         language = "typescript"
//     else if (language === "py")
//         language = "python"

//     function debounce(func: (value: string) => void, wait: number) {
//         let timeout: NodeJS.Timeout;

//         return (value: string) => {
//             clearTimeout(timeout);
//             timeout = setTimeout(() => {
//                 func(value);
//             }, wait);
//         };
//     }

//     return (
//         <Editor
//             height="100vh"
//             language={language}
//             value={code}
//             theme="vs-dark"
//         // onChange={debounce((value) => {
//         //     // Should send diffs, for now sending the whole file
//         //     // PR and win a bounty!
//         //     socket.emit("updateContent", { path: selectedFile.path, content: value });
//         // }, 500)}
//         />
//     )
// }
