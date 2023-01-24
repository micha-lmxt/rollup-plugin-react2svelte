import { currentFile } from "./currentFile.js";

export const isCreateElement = (node, fromImport = []) =>
    node.type === "CallExpression" && ((currentFile.react.includes(node.callee?.object?.name) &&
        node.callee?.property?.name === "createElement")
        || fromImport.includes(node.callee?.name)) ||
    (currentFile.createElement.includes(node.callee?.name))

export const isComponent = (node) => (
    node.arguments?.[0].type === "Identifier" || node.arguments?.[0].type === "MemberExpression")

export const isFragment = (node) => {
    return (node.arguments?.[0].type === "MemberExpression" && 
        currentFile.react.includes(node.object?.name) && 
        node.property?.name === "Fragment") ||
        (node.arguments?.[0].type === "Identifier" &&
            currentFile.Fragment.includes(node.arguments?.[0].name))
}