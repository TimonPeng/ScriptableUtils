// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: laptop-code;
// NOTE: This script was written by TimonPeng: https://github.com/TimonPeng/ScriptableUtils

class XML2JSON {
  constructor(xml, { debug = false } = {}) {
    this.trees = [];
    this.debug = debug;

    let index = -1;
    let errorTag = null;

    const parser = new XMLParser(xml);

    parser.didStartDocument = () => this.log("didStartDocument");

    parser.didEndDocument = () => this.log("didEndDocument");

    parser.didStartElement = (tag, attributes) => {
      index += 1;
      this.log(
        `didStartElement: index=${index}, tag=${tag}, attributes=${JSON.stringify(
          attributes
        )}`
      );

      this.trees.push({
        tag: this.capitalizeFirstLetter(tag),
        attributes,
        content: "",
        children: [],
      });
    };
    parser.didEndElement = (tag) => {
      this.log(`didEndElement: ${tag}`);

      if (index !== 0) {
        const lastElement = this.trees.pop();
        this.trees[index - 1].children.push(lastElement);

        index -= 1;
      }
    };

    parser.foundCharacters = (str) => {
      this.log(`foundCharacters: ${str}`);

      this.trees[index].content += str
        // prefix spaces
        .replace(/^\s*/g, "")
        // suffix spaces
        .replace(/\s*$/g, "");
    };

    parser.parseErrorOccurred = (error) => {
      this.log(`parseErrorOccurred: ${error}`);

      errorTag = this.trees[index].tag;
    };

    const result = parser.parse();

    if (!result) throw new Error(`XML Parsing error: ${errorTag}`);
    if (this.trees.length !== 1) throw new Error(`XML Parsing error`);

    this.log(`trees: ${JSON.stringify(this.trees, null, 2)}`);
  }

  log(message) {
    this.debug && console.log(message);
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

class WidgetXML extends XML2JSON {
  constructor(xml, { debug = false } = {}) {
    super(xml, { debug });

    // global prototypes for elements
    this.globalPrototypes = [
      "textColor",
      "font",
      "textOpacity",
      "shadowColor",
      "shadowRadius",
      "shadowOffset",
    ];
    for (const key of this.globalPrototypes) {
      this[key] = null;
    }

    this.textColor = null;
    this.font = null;
    this.textOpacity = null;
    this.shadowColor = null;
    this.shadowRadius = null;
    this.shadowOffset = null;

    this.interfaces = {
      Widget: {
        initializerProps: false,
        prototypes: [
          "backgroundColor",
          "backgroundImage",
          "backgroundGradient",
          "spacing",
          "url",
          "refreshAfterDate",
        ],
        elements: ["Text", "Date", "Image", "Spacer", "Stack"],
        functions: ["setPadding", "useDefaultPadding"],
      },
      Date: {
        initializerProps: true,
        prototypes: [
          "date",
          "textColor",
          "font",
          "textOpacity",
          "lineLimit",
          "minimumScaleFactor",
          "shadowColor",
          "shadowRadius",
          "shadowOffset",
          "url",
        ],
        elements: [],
        functions: [
          "leftAlignText",
          "centerAlignText",
          "rightAlignText",
          "applyTimeStyle",
          "applyDateStyle",
          "applyRelativeStyle",
          "applyOffsetStyle",
          "applyTimerStyle",
        ],
      },
      Image: {
        prototypes: [
          "image",
          "resizable",
          "imageSize",
          "imageOpacity",
          "cornerRadius",
          "borderWidth",
          "borderColor",
          "containerRelativeShape",
          "tintColor",
          "url",
        ],
        elements: [],
        functions: [
          "leftAlignImage",
          "centerAlignImage",
          "rightAlignImage",
          "applyFittingContentMode",
          "applyFillingContentMode",
        ],
      },
      Spacer: {
        prototypes: ["length"],
        elements: [],
        functions: [],
      },
      Stack: {
        prototypes: [
          "backgroundColor",
          "backgroundImage",
          "backgroundGradient",
          "spacing",
          "size",
          "cornerRadius",
          "borderWidth",
          "borderColor",
          "url",
        ],
        elements: ["Text", "Date", "Image", "Spacer", "Stack"],
        functions: [
          "setPadding",
          "useDefaultPadding",
          "topAlignContent",
          "centerAlignContent",
          "bottomAlignContent",
          "layoutHorizontally",
          "layoutVertically",
        ],
      },
      Text: {
        initializerProps: true,
        prototypes: [
          "text",
          "textColor",
          "font",
          "textOpacity",
          "lineLimit",
          "minimumScaleFactor",
          "shadowColor",
          "shadowRadius",
          "shadowOffset",
          "url",
        ],
        elements: [],
        functions: ["leftAlignText", "centerAlignText", "rightAlignText"],
      },
    };
  }

  create() {
    const root = this.trees[0];
    const { tag, attributes } = root;

    if (tag !== "Widget") throw new Error(`Root must be a Widget: ${tag}`);

    const widget = new ListWidget();

    const { prototypes, functions } = this.interfaces.Widget;

    for (const [key, value] of Object.entries(attributes)) {
      if (this.globalPrototypes.includes(key)) this[key] = value;
      else if (prototypes.includes(key)) eval(`widget.${key} = ${value}`);
      else if (functions.includes(key)) eval(`widget.${key}${value}`);
    }

    this.setElement(widget, root);

    return widget;
  }

  setElement(parentElement, parentInfo) {
    const parentInterfaces = this.interfaces[parentInfo.tag];
    if (!parentInterfaces)
      throw new Error(`Unsupport element ${parentInfo.tag}`);
    const { elements } = parentInterfaces;

    for (const child of parentInfo.children) {
      const { tag, attributes, content } = child;

      if (!elements.includes(tag))
        throw new Error(`Unsupport child element ${tag} for ${parentInfo.tag}`);

      const interfaces = this.interfaces[tag];
      if (!interfaces) throw new Error(`Unsupport element ${tag}`);
      const { initializerProps, prototypes, functions } = interfaces;

      if (initializerProps && !content)
        throw new Error(`Element ${tag} must have a content`);

      // if conditional
      const { if: ifConditional } = attributes;

      if (!ifConditional || (ifConditional && eval(ifConditional))) {
        const childElement = eval(`parentElement.add${tag}(${content})`);

        // set global prototypes for element
        for (const key of this.globalPrototypes) {
          if (prototypes.includes(key) && this[key])
            eval(`childElement.${key} = ${this[key]}`);
        }

        for (const [key, value] of Object.entries(attributes)) {
          if (prototypes.includes(key)) eval(`childElement.${key} = ${value}`);
          else if (functions.includes(key)) eval(`childElement.${key}${value}`);
        }

        this.setElement(childElement, child);
      }
    }
  }
}

module.exports = { WidgetXML };
