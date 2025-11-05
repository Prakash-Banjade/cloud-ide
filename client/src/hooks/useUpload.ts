import { EItemType } from "@/types/tree.types"
import { useAppMutation } from "./useAppMutation";
import { ChangeEvent, useMemo, useTransition } from "react";
import { POD_DOMAIN } from "@/lib/CONSTANTS";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  type: EItemType,
  path: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 100;

export default function useUpload() {
  const [isPending, startTransition] = useTransition();
  const { mutateAsync } = useAppMutation();
  const { replId } = useParams();

  const podUrl = useMemo(() => {
    if (process.env.NODE_ENV === "production" && replId) {
      return `https://${replId}.${POD_DOMAIN}/project/upload`;
    }
    return `http://localhost:3003/project/upload`;
  }, [replId])

  const upload = (e: ChangeEvent<HTMLInputElement>, { type, path }: Props) => {
    const files = e.target.files;

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
        await mutateAsync({
          endpoint: podUrl,
          method: 'post',
          data: formData,
        });
      } catch (e) {
        console.log(e);
        toast.error("Failed to upload");
      }
    });
  }

  return { upload, isPending }
}