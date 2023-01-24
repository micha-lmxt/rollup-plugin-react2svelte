import { findAssignments } from "./findAssignments.js";
import { $getProps, $interopRefresh, $React, importReact } from "./symbols.js";
import { currentFile } from "./currentFile.js";


export const handleCreateComponent = (node, code, jsxImports,nested=true) => {
  const id = node.arguments[0];
  const assign = findAssignments(id, code, jsxImports,nested);

  const name = code.slice(id.start, id.end);
  const imports = [importReact, ...assign.imports];

  const ex = {};
  let ownPropsTemplate = "",
    cleanedProps = "";
  const pnode = node.arguments[1];

  const children = [];
  const childProps = [];
  let childAssignments = new Set([]);
  if (!currentFile.reactJSXImportStyle) {
    for (let k = 2; k < node.arguments.length; k++) {
      const child = node.arguments[k];
      const childAssignment = findAssignments(child,code,jsxImports,nested);
      if (childAssignment.imports){
        childAssignment.imports.forEach(v=>imports.push(v));
      }
      childAssignments = new Set([...childAssignments,...(childAssignment.assignments||[])]);
      children.push(childAssignment.text);
      childProps.push(`${$getProps}(${childAssignment.text})`)
    }
  }
  const assignments = pnode ? findAssignments(pnode, code, jsxImports,nested) : { imports: [], assignments: new Set([]), text: "{}" };
  assignments.imports.forEach(v => imports.push(v));
  //if (pnode) {
    const childrenString = children.length === 0 ? "" : 
      children.length === 1 ? "children: " + children[0] + "," :
      ("children:[" + children.join(",") + "],");
    ownPropsTemplate = `props={{${childrenString}...${assignments.text}}}`;
    cleanedProps = `{${childrenString}...${assignments.text}}`;

    //ownPropsTemplate.slice(7,-1)
  //}
  const childPropsString = childProps.length === 0
    ? ""
    : childProps.length === 1
      ? `children:${childProps[0]},`
      : `children:[${childProps.join(",")}],`;

  
  return {
    imports,
    props: `{type:${name},props:{${childPropsString}...${assignments.text}}}`,
    template: `<${$React} fc={${name}} ${ownPropsTemplate} noSlot={true} {${$interopRefresh}}><slot/></${$React}>`,
    exports: ex,
    assignments: new Set([$interopRefresh,...(assign.assignments || []), ...(childAssignments || []), ...(assignments.assignments || [])]),
    name:assign.text,
    cleanedProps
  };
};
