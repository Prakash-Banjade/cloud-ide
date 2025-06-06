import { ELanguage } from "src/global-types";

const runCommands: Partial<Record<ELanguage, string>> = {
    [ELanguage.REACT_JS]: "npm run dev",
    [ELanguage.REACT_TS]: "npm run dev",
    [ELanguage.NEXT_TS]: "npm run dev",
};

export const getRunCommand = (language: ELanguage, filePath?: string) => {
    if (language in runCommands) return runCommands[language];

    if (!filePath) return;

    if (language === ELanguage.C) {
        const filename = filePath.replaceAll('/', '');

        const cmd = `gcc ${filename} -o bin/${filename.split('.')[0]} && ./bin/${filename.split('.')[0]}`;

        return cmd;
    }

    if (language === ELanguage.CPP) {
        const filename = filePath.replaceAll('/', '');

        const cmd = `g++ ${filename} -o bin/${filename.split('.')[0]} && ./bin/${filename.split('.')[0]}`;

        return cmd;
    }

    if (language === ELanguage.PYTHON) {
        const filename = filePath.replaceAll('/', '');

        return `python3 ${filename}`;
    }

    if (language === ELanguage.NODE_JS) {
        const filename = filePath.replaceAll('/', '');

        return `node ${filename}`;
    }
};