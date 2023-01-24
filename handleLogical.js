import { handleNode } from "./handleNode.js";
import { findAssignments } from "./findAssignments.js";
import { $getProps, importAnything } from "./symbols.js";

export const handleLogical = (node,code,jsxImports) => {
    if (node.operator === "&&" || node.operator === "&") {
        const right = handleNode(node.right,code,jsxImports);
        //const cond = "l" + next();
        //right.exports[cond] = { start: node.left.start, end: node.left.end };
        const leftAssignments = findAssignments(node.left,code,jsxImports)
        //const rightAssignments = findAssignments(node.right,code,jsxImports)
        return {
            assignments: new Set([...(right.assignments||[]),...(leftAssignments.assignments||[])]),
            imports: (right.imports||[]).concat(leftAssignments.imports||[]),
            props: `${leftAssignments.text} && ${right.props}` ,
            template: `{#if ${leftAssignments.text}}${right.template}{/if}`,
            exports: right.exports,
        };
    }
    if (node.operator === "||" || node.operator === "|") {
        const anyAssignments = findAssignments(node, code, jsxImports);

        const res = {
            props: `${$getProps}(${anyAssignments.props})`,
            template: `<Anything symbol={${anyAssignments.text}}><slot></slot></Anything>`,
            exports: {},
            imports: [importAnything].concat(anyAssignments.imports || []),
            assignments: anyAssignments.assignments || new Set([])
        };

        return res;

    }
    return {
        props: {},
        template: "",
        exports: {}
    };
};
