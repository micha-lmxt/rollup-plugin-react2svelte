import { walk } from "estree-walker";
import is_reference from "is-reference";
import MagicString from "magic-string";
import { parse } from "./parse.js";

const keywords = ["this", "class"]
/**
 * 
 * @param {string[]} list 
 * @param {boolean} early return a boolean, when a keyword is found 
 * @returns 
 */
export const hasKeywords = (list,early=true) => {
    const found = []
    for (let kw of keywords){
        if (list.includes(kw)) {
            if (early){
                return true;
            }
            found.push(kw)
        }
    }
    return found.length > 0 ? found : false;
}
/**
 * 
 * @param {string[]} list 
 * @param {string}text
 * @returns 
 */
export const replaceKeywords = (list,text)=>{
    
    const kw = hasKeywords(list,false);
    if (!kw){
        return {list,text};
    }
    const hasThis = kw.includes("this")
    const kwl = kw.filter(v=>v!=="this")
    const code = new MagicString("x="+text);
    const n = parse.current("x="+text);
    
    walk(n,{
        enter:(node)=>{
            if (hasThis && node.type==="ThisExpression"){
            
                code.update(node.start,node.end,"_$this$_")
            }
            if (is_reference(node)){
                kwl.forEach(v=>{
                    if (node.name===v){
                        code.update(node.start,node.end,`_$${v}$_`)
                    }
                })
            }
            
            
            
        }
    })
    
    return {list:list.map(v=>kw.includes(v)?`_$${v}$_`:v),text:code.toString().slice(2)};

}

export const isReplacedKeyword = (word)=>(word.startsWith("_$") && word.endsWith("$_"))
export const makeReplacedOutput = (word)=> 
    keywords.includes(word)?word + ":_$"+word+"$_" :word
