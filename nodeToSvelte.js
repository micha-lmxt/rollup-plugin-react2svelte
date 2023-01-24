import { handleNode } from "./handleNode.js";
import { $interopRefresh } from "./symbols.js";

//assumes a parsed node of type React.createElement("div", null, "Hello World")
export const nodeToSvelte = (node, code, jsxImports) => {
  const result = handleNode(node, code, jsxImports);

  const res = {
    props: result.props,
    code: `${generateScript(
      result.exports,
      result.imports,
      result.assignments
    )}${result.template}`,
    exports: result.exports,
    assignments: result.assignments
  };
  //console.log(res);
  return res;
};
/**
 *
 * @param {{[key:string]:string}} exports
 * @param {string[]|undefined} imports
 */
const generateScript = (
  exports,
  imports = undefined,
  assignments = undefined
) => {
  if (Object.keys(exports).length === 0 && !imports) {
    return "";
  }
  let ex = Array.from(assignments || new Set([]));
  //ex.push($interopRefresh)
  for (const [key, value] of Object.entries(exports)) {
    ex.push(key);
  }
  let imp = [];

  if (imports) {
    const imps = new Set(imports);
    imp = Array.from(imps);
  }
  if (imp.length===0 && ex.length===0){
    return "";
  }
  return (
    `<script>
`+ (imp.length > 0 ? `  ` + imp.map((v) => v + ";").join(`\n  `) +"\n": "") +
    (ex.length > 0 ? `  export let ${ ex.join(`,\n     `)};
` : "") +
`</script >
`
  );
};


