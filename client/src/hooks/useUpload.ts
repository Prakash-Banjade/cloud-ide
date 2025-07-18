import { EItemType, TreeItem } from "@/types/tree.types"
import { useAppMutation } from "./useAppMutation";
import { ChangeEvent, useTransition } from "react";
import { POD_DOMAIN, SocketEvents } from "@/lib/CONSTANTS";
import { useSocket } from "@/context/socket-provider";
import { useCodingStates } from "@/context/coding-states-provider";
import { updateTree } from "@/app/code/[replId]/fns/file-manager-fns";
import { useParams } from "next/navigation";
import { insertTreeItems } from "@/app/code/[replId]/fns/tree-mutation-fns";

type Props = {
  type: EItemType,
  path: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 100;

export default function useUpload() {
  const [isPending, startTransition] = useTransition();
  const { mutateAsync } = useAppMutation();
  const { setFileStructure } = useCodingStates();
  const { replId } = useParams();

  const upload = (e: ChangeEvent<HTMLInputElement>, { type, path }: Props) => {
    const files = e.target.files;

    const pathWithOutLeadingSlash = path.startsWith('/') ? path.slice(1) : path;

    if (!files || files.length === 0) return;

    const formData = new FormData();

    if (files.length > MAX_FILES) {
      throw new Error('You can only upload up to 100 files at once.');
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size is too large. Max size is 5MB.');
      }

      if (type === EItemType.FILE) {
        formData.append('files', file, `${path}/${file.name}`);
      } else {
        formData.append('files', file, `${path}/${file.webkitRelativePath}`);
      }
    }

    formData.append('parentPath', path);

    startTransition(async () => {
      try {
        const res = await mutateAsync({
          // endpoint: `https://${replId}.${POD_DOMAIN}/project/upload`,
          endpoint: `http://localhost:3003/project/upload`,
          method: 'post',
          data: formData,
        });

        console.log(path, res.data)

        if (res.data) {
          setFileStructure(prev => insertTreeItems(
            prev,
            res.data as TreeItem[],
            path
          ));
        }
      } catch (e) {
        console.log(e)
      }
    });
  }

  return { upload, isPending }
}