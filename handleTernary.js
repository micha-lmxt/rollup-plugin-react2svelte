import { mergeImports } from "./mergeUtils.js";
import { handleNode } from "./handleNode.js";
import { findAssignments } from "./findAssignments.js";

export const handleTernary = (node,code,jsxImports) => {
    //let res = { props: {}, template: "", exports: {} };
    const consequent = handleNode(node.consequent,code,jsxImports);
    const alternate = handleNode(node.alternate,code,jsxImports);
    const test = findAssignments(node.test,code,jsxImports);
    let res = {
        imports: [...mergeImports(consequent, alternate),...test.imports],
        props: `${test.text} ? ${consequent.props} : ${alternate.props}`,
        template: `{#if ${test.text}}
            ${consequent.template}
            ${alternate.template ? `{:else}
            ${alternate.template}` : ""}
            {/if}
            `,
        exports: {
            ...consequent.exports, ...alternate.exports
        },
        assignments:new Set([...(consequent.assignments||[]),...(alternate.assignments||[]),...(test.assignments||[])])
    };
    //res.exports["t" + i] = { start: node.test.start, end: node.test.end };
    return res;
};
