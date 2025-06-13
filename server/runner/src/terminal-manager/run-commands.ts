import { ELanguage } from "src/global-types";

export const longRunningProcesses: Partial<Record<ELanguage, string>> = {
    [ELanguage.REACT_JS]: "npm run dev",
    [ELanguage.REACT_TS]: "npm run dev",
    [ELanguage.NEXT_TS]: "npm run dev",
};

export const getRunCommand = (language: ELanguage, filePath?: string) => {
    if (language in longRunningProcesses) return longRunningProcesses[language];

    if (!filePath) return;
    const filename = filePath.replaceAll('/', '');
    const filenameWithoutExt = filename.split('.')[0];

    if (language === ELanguage.C) {
        return `gcc ${filename} -o ../tmp/${filenameWithoutExt} && ./../tmp/${filenameWithoutExt} && echo`; // echo is done to get a new line bcz the output is showing in same line
    }

    if (language === ELanguage.CPP) {
        return `g++ ${filename} -o ../tmp/${filenameWithoutExt} && ./../tmp/${filenameWithoutExt} && echo`;
    }

    if (language === ELanguage.PYTHON) {
        return `python3 ${filename} && echo`;
    }

    if (language === ELanguage.NODE_JS) {
        return `node ${filename} && echo`;
    }
};