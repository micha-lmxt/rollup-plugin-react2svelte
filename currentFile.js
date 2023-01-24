export const currentFile = {
    current: "",
    components: ["ClassComponent$"],
    react: ["REACT$","React"],
    createElement: ["createElement$"],
    reactJSXImportStyle: false,
    inline: true,
    debug: false,
    Fragment:[],
    hasReactNameImport:false
}

/**
 * 
 * @param {string} id 
 */
export const setCurrentfile = (id) => {
    currentFile.current = id;
    currentFile.components = ["ClassComponent$"]
    currentFile.react = ["REACT$","React"]
    currentFile.createElement = ["createElement$"]
    currentFile.reactJSXImportStyle = false;
    currentFile.debug = false;
    currentFile.Fragment = [];
    
    currentFile.hasReactNameImport=false
}