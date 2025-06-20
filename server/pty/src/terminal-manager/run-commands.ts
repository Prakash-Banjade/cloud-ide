import { ELanguage } from "src/global-types";

export const longRunningProcesses: Partial<Record<ELanguage, string>> = {
    [ELanguage.REACT_JS]: "npm run dev",
    [ELanguage.REACT_TS]: "npm run dev",
    [ELanguage.NEXT_TS]: "npm run dev",
};

export const getRunCommand = (language: ELanguage, filePath?: string) => {
    if (language in longRunningProcesses) return longRunningProcesses[language];

    const filename = filePath?.replaceAll('/', '') || defaultFilePath[language];
    const filenameWithoutExt = filename.split('.')[0];

    if (language === ELanguage.C) {
        return `gcc ${filename} -o ../tmp/${filenameWithoutExt} && ./../tmp/${filenameWithoutExt}`;
    }

    if (language === ELanguage.CPP) {
        return `g++ ${filename} -o ../tmp/${filenameWithoutExt} && ./../tmp/${filenameWithoutExt}`;
    }

    if (language === ELanguage.PYTHON) {
        return `python3 ${filename}`;
    }

    if (language === ELanguage.NODE_JS) {
        return `node ${filename}`;
    }

    if (language === ELanguage.JAVA) {
        return `javac ${filename} && java ${filenameWithoutExt}`;
    }
};

const defaultFilePath = {
    [ELanguage.C]: 'main.c',
    [ELanguage.CPP]: 'main.cpp',
    [ELanguage.PYTHON]: 'main.py',
    [ELanguage.NODE_JS]: 'index.js',
    [ELanguage.JAVA]: 'Main.java',
}