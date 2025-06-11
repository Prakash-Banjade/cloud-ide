import cookie from 'js-cookie';
import { z } from 'zod';

/**
 * Return the path with the most segments.  
 * Segments are the parts between slashes; empty segments are ignored.
 * If there’s a tie, returns the first one encountered.
 *
 * @param paths Array of file‐system–style paths (e.g. "src/utils/foo.js")
 * @returns The path with the greatest depth, or `null` if the input is empty.
 */
export function getDeepestPath(paths: string[]): string | null {
    if (paths.length === 0) return null;

    let deepest = paths[0];
    let maxSegments = countSegments(deepest);

    for (let i = 1; i < paths.length; i++) {
        const p = paths[i];
        const segCount = countSegments(p);
        if (segCount > maxSegments) {
            maxSegments = segCount;
            deepest = p;
        }
    }

    return deepest;
}

/** Count non‐empty segments in a slash‐separated path. */
function countSegments(path: string): number {
    return path
        .split(/[\\/]/)        // split on forward or backslashes
        .filter(Boolean)       // remove empty strings
        .length;
}


export function getCookieAllPaths(replId: string): string[] {
    const openedFiles = cookie.get(`openedFiles:${replId}`);
    const mruFiles = cookie.get(`mruFiles:${replId}`);
    const selectedFile = cookie.get(`selectedFile:${replId}`);

    const allPaths: string[] = [selectedFile ?? ''];

    try {
        if (openedFiles) {
            const parsedData = JSON.parse(openedFiles);

            const { data, success } = z.array(z.string()).safeParse(parsedData);

            if (success) {
                allPaths.push(...data);
            }
        }
        if (mruFiles) {
            const parsedData = JSON.parse(mruFiles);

            const { data, success } = z.array(z.string()).safeParse(parsedData);

            if (success) {
                allPaths.push(...data);
            }
        }
    } catch (e) {
        console.error(e);
    }

    return allPaths;
}