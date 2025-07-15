import { EItemType } from "@/types/tree.types"
import { useAppMutation } from "./useAppMutation";
import { ChangeEvent, useTransition } from "react";
import { POD_DOMAIN } from "@/lib/CONSTANTS";

type Props = {
  type: EItemType
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function useUpload() {
  const [isPending, startTransition] = useTransition();
  const { mutateAsync } = useAppMutation();

  const upload = (e: ChangeEvent<HTMLInputElement>, { type }: Props) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;

    const formData = new FormData();

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size is too large. Max size is 5MB.');
      }

      if (type === EItemType.FILE) {
        formData.append('files', file);
      } else {
        formData.append('files', file, file.webkitRelativePath);
      }
    }

    startTransition(async () => {
      try {
        await mutateAsync({
          // endpoint: `https://${POD_DOMAIN}/project/upload`,
          endpoint: `http://localhost:3003/project/upload`,
          method: 'post',
          data: formData,
        });
      } catch (e) {
        console.log(e)
      }
    });
  }

  return { upload, isPending }
}