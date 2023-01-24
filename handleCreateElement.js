import { handleNode } from "./handleNode.js";
import { mergeResults, mergeImports } from "./mergeUtils.js";
import { handleProps } from "./handleProps.js";
import { currentFile } from "./currentFile.js";


export const handleCreateElement = (node, code, jsxImports) => {
  //console.log(node.arguments[1]?.properties?.find(v=>v.key?.name === "children"))
  let argsLen = node.arguments.length;
  let children = {
    props: undefined,
    template: "",
    exports: {},
    imports: undefined,
    assignments: new Set([]),
  };
  if (!currentFile.reactJSXImportStyle) {
    for (let q = 2; q < argsLen; q++) {
      const child = node.arguments[q];


      children = mergeResults(children, handleNode(child, code, jsxImports));

    }
  }
  const propchildren = node.arguments[1]?.properties?.find(v => v.key?.name === "children");

  if (propchildren) {
    
    const childrenNodes = propchildren.value?.type === "ArrayExpression" ?
      propchildren.value?.elements : [propchildren.value];
    for (let t = 0; t < childrenNodes.length; t++) {
      argsLen++;

      children = mergeResults(children, handleNode(childrenNodes[t], code, jsxImports));
    }
  }
  const ownProps = handleProps(code, jsxImports, node.arguments[1]);
  
  const childPropsString = argsLen <= 2
    ? ""
    : argsLen === 3
      ? `children: ${children.props},`
      : `children: [${children.props}],`;

  //console.log("\n" + "--------------------------\n" +
  //  node.arguments[0].value + "\n_______________________\n")
  return {
    imports: mergeImports(children, ownProps),
    props: `{type:'${node.arguments[0].value}',props:{${childPropsString}${ownProps.props}}}`,
    template: handleTemplate(node.arguments[0], ownProps, children.template),
    exports: { ...children.exports, ...ownProps.export },
    assignments: new Set([
      ...(ownProps.assignments || []),
      ...(children.assignments || []),
    ]),
  };
};
const voidElements = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
export const skipPropValue = Symbol("don't show prop key");
/**
 *
 * @param {any} node
 * @param {{imports?:string[],export:{start:number,end:number},toTag:{[key:string]:string},props:string,hasSpread?:string}} props
 * @param {string} inner
 * @returns
 */
const handleTemplate = (node, props, inner) => {
  if (node.type === "Literal") {
    let propstring = "";
    for (const [key, value] of Object.entries(props.toTag)) {
      if (value === skipPropValue) {
        propstring += ` ${key}`;
      } else {
        propstring += ` ${key}={${value}}`;
      }
    }
    if (voidElements.includes(node.value)) {
      return `<${node.value}${propstring}/>`;
    }
    let spreadedChildren = "";
    if (props.hasSpread){
      spreadedChildren = `<Anything symbol={(${props.hasSpread})?.children}><slot/></Anything>`;
    }
    return (
      "<" + node.value + propstring + ">"+ spreadedChildren + inner + "</" + node.value + ">"
    );
  }
  if (node.type === "Identifier") {
    console.log("unhandled identifier case");
    console.log(node);
  }

  //if (node.type==="MemberExpression"){
  return inner;
};
