import { uuidv4 } from "@/assets/utils"

export function generateComfyObjects(jsonObject) {
  // making types
  // collect inputs from json object
  let type = {};
  let arrayType = {}; // rename or refactoring
  //TODO: validation about specialTypes.
  Object.keys(jsonObject).forEach(nodeName => {
    Object.values(jsonObject[nodeName].input).forEach(input => {
      if (input == jsonObject[nodeName].input.hidden) {
        return;
      }
      Object.keys(input).forEach(inputName => {
        const inputType = input[inputName];
        if (!Array.isArray(inputType)) {
          console.error(`inputType ${inputType} for ${nodeName} is not array`);
        }
        const specialType = ["*", "INT", "FLOAT", "STRING"];
        const cand = inputType[0];
        if (Array.isArray(cand)) {
          // console.log(nodeName, inputName, cand);
          if (!arrayType[nodeName]) {
            arrayType[nodeName] = {};
          }
          arrayType[nodeName][inputName] = cand;
        } else if (!specialType.includes(cand) && !type[cand]) {
          type[cand] = class { };
        }
      });
    });
  });
  // console.log("type created");

  // making nodes
  let node = {};
  Object.keys(jsonObject).forEach(nodeName => {
    node[nodeName] = class {

      constructor() {
        this.name = nodeName;
        this.id = `${this.name}-${uuidv4()}`;
        let argIndex = 0;
        // makit for loop if possible.
        if (jsonObject[nodeName].input.required) {
          this.required = jsonObject[nodeName].input.required;
          Object.keys(jsonObject[nodeName].input.required).forEach(arg => {
            this.set(arg, arguments[argIndex]);
            ++argIndex;
          });
        }
        if (jsonObject[nodeName].input.optional) {
          this.optional = jsonObject[nodeName].input.optional;
          Object.keys(jsonObject[nodeName].input.optional).forEach(arg => {
            this.set(arg, arguments[argIndex]);
            ++argIndex;
          });
        }

        if (jsonObject[nodeName].output) {
          this.output = jsonObject[nodeName].output;
          for (let i = 0; i < this.output.length; i++) {
            this[this.output[i]] = [this, i];
          }
        }
      };

      set(arg, value) {
        // console.log(node, arg, value);

        if (value == null || value == undefined) {
          this[arg] = undefined;
          return;
        }

        const candidates = [this.required, this.optional];

        for (let i = 0; i < candidates.length; i++) {
          // e.g. KSampler.set(positive, new CLIPTextEncode(CLIP, "1girl,"))

          // !!!!! REFACTORING NEEEEEEEDEDDDDDD !!!!!
          if (!Array.isArray(value) && !Object.keys(node).includes(value.name)) { // it should be specialType
            const type = candidates[i][arg][0];
            const specialType = ["*", "BOOLEAN", "INT", "FLOAT", "STRING"];

            if (Array.isArray(type)) {
              if (type.includes(value)) {
                this[arg] = value;
                // console.log(this[arg]);
                break;
              }
            } else if (specialType.includes(type)) {  // special character, just put it in.
              this[arg] = value;
              // console.log(this[arg]);
              break;
            }
            console.error(`value '${value}' is not in ${arg} array`, type); //, arrayType[this.name]);
          }


          if (Object.keys(candidates[i]).includes(arg)) {
            const type = candidates[i][arg][0];
            // if it is node, find acceptable output.
            const actualValue = (value.name) ? value[type] : value;
            // check type of value
            if (actualValue[0].output[actualValue[1]] != type) {
              throw new Error(`Wrong type: expecting ${type} but got ${actualValue[0].output[actualValue[1]]}`);
            }
            this[arg] = actualValue;
            break;
          }
        }
      }

      get() {
        // type or index?
      }

      toWorkflow() {
        let nodesToAppend = [];
        let json = {};
        json[this.id] = {};
        const args = [this.required, this.optional];
        if (this.required || this.optional) {
          json[this.id]["inputs"] = {};
        }

        args.forEach(eachArgs => {
          if (eachArgs) {
            Object.keys(eachArgs).forEach(arg => {
              if (this[arg] == undefined) {
                throw Error(`Missing argument: ${arg} on ${this.id}`);
              }
              // console.log(arg, this[arg]);
              json[this.id]["inputs"][arg] = Array.isArray(this[arg]) ? this[arg].slice() : this[arg];
              if (Array.isArray(this[arg]) && Object.keys(node).includes(this[arg][0].name)) {
                nodesToAppend.push(this[arg][0]);
                json[this.id]["inputs"][arg][0] = this[arg][0].id;
              }
              // console.log(json[this.id]["inputs"]);
            });
          }
        })
        json[this.id]["class_type"] = this.name;
        // json[this.id]["_meta"] = {}
        // json[this.id]["_meta"]["title"] = this.name;  // need?

        nodesToAppend.forEach(additionalNode => {
          json = Object.assign(json, additionalNode.toWorkflow());
        });
        return json;
      }
    }
    Object.defineProperty(node[nodeName], 'name', { value: nodeName });
  });
  // console.log("node created");

  return [node, type, arrayType];
}