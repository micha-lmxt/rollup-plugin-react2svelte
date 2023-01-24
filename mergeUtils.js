
export const mergeImports = (p1, p2) => {
    if (p1.imports) {

        if (p2.imports) {
            return p1.imports.concat(p2.imports);
        }
        return p1.imports;
    }
    return p2.imports ? p2.imports : [];
};
export const mergeResults = (p1, p2) => {
    return {
        imports: mergeImports(p1, p2),
        props: p1.props!==undefined ? (p2.props!==undefined ? p1.props + "," + p2.props : p1.props) :
            p2.props!==undefined ? p2.props : undefined,
        template: p1.template + p2.template,
        exports: { ...p1.exports, ...p2.exports },
        assignments: new Set([...(p1.assignments||[]),...(p2.assignments||[])])
    };

};
