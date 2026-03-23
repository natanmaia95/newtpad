/**
 * Checks if a path is valid for a Note.
 *
 * @param {string} path 
 */
export function isValidNotePath(path) {
    if (path.startsWith("/")) return false;
    if (path.includes("//")) return false;
    if (path.includes("\\")) return false;
    if (path.includes(" ")) return false;
    // return true;

    return URL.canParse(path, "http://www.newtpad.com/")
} 
