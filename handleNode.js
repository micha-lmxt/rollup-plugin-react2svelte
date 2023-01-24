import { currentFile } from "./currentFile.js";
import { findAssignments } from "./findAssignments.js";
import { handleLogical } from "./handleLogical.js";
import { handleTernary } from "./handleTernary.js";
import { isComponent, isCreateElement } from "./isCreateElement.js";
import { handleCreateElement } from "./handleCreateElement.js";
import { handleCreateComponent } from "./handleCreateComponent.js";
import { $getProps, importAnything } from "./symbols.js";
/**
 *
 * @param {any} node
 * @returns {{assignments?:Set<string>,imports?:string[],template:string,exports:{[key:string]:string},props:{[key:string]:{start:number,end:number}},rProps:{[key:string]:any},type:string}}
 */
export const handleNode = (node, code, jsxImports) => {
    if (isCreateElement(node, jsxImports)) {
        if (isComponent(node)) {
            return handleCreateComponent(node, code, jsxImports);
        }
        if (node.arguments?.[0].value === "script") {

            console.log("\n" + currentFile.current + "\nWarning: Script tags are currently not allowed")

            return {
                imports: [],
                props: "",
                template: "",
                exports: {},
                assignments: new Set([])
            };
        }
        if (node.arguments?.[0].value === "style") {
            console.log("\n" + currentFile.current + "\nWarning: Style tag not supported!");
            console.log(code.slice(node.start, node.end));
            return {
                imports: [],
                props: "",
                template: "",
                exports: {},
                assigments: new Set([])
            }
        }
        return handleCreateElement(node, code, jsxImports);
    } else if (node.type === "Literal") {
        if (node.value===null||node.value===undefined){
            return {
                props:"null",
                template:"",
                exports:""
            }
        }
        return {
            props: `'${node.value}'`,
            template: `{"${node.value}"}`,
            exports: {}
        };
    } else if (node.type === "TemplateLiteral"){
        const assign = findAssignments(node,code,jsxImports);
        
        return {
            props:`${assign.props}`,
            template: `{${assign.text}}`,
            assignments: assign.assignments,
            exports:{},
            imports: assign.imports
        }
    } else if (node.type === "ConditionalExpression") {
        return handleTernary(node, code, jsxImports);
    } else if (node.type === "LogicalExpression") {
        return handleLogical(node, code, jsxImports);
        /*} else if (node.type === "ArrayExpression"){
            console.log(node)
            //TODO: Handle this
            return {
                props: {},
                template: "",
                exports: {}
            };
        }else if (node.type==="CallExpression" ){
            // array .map could be handled here
            console.log(node)
        */
    } else if (node.type === "ArrayExpression") {
        const els = node.elements.map(v => handleNode(v, code, jsxImports))
        return {
            props: `[${els.map(v => v.props).join(",")}]`,
            template: els.map(v => v.template).join("\n"),
            exports: els.reduce((p, v) => ({ ...p, ...(v.exports || {}) }, {})),
            imports: els.map(v => (v.imports || [])).flat(),
            assignments: new Set([...els.map(v => [...(v.assignments || [])]).flat()])
        }
    } else if (node.type === "Identifier" || node.type === 'CallExpression' || node.type === "MemberExpression") {
        

        // could be anything
        //const d = "d" + next();
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
    if (node.type === "UnaryExpression") {
        return {
            props: ``,
            template: "",
            exports: {},
            imports: [],
            assignments: new Set([])
        };
    }
    console.log("\n")
    console.log(currentFile.current)
    console.log("Unhandled case");
    console.log(node);
    console.log(code.slice(node.start - 10, node.end + 10))
    return {
        props: {},
        template: "",
        exports: {}
    };
};
