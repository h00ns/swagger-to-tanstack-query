/**
 * Pre-tokenized code for the decorative hero code-morph (DESIGN.md §4.1.2 / §4.1.4).
 * No runtime highlighter is used — each line is an array of {text, color} spans
 * colored with the §2.3 syntax palette hexes.
 */

export const SYNTAX = {
  keyword: "#FF7AB6",
  string: "#8DE98D",
  function: "#5FE6EF",
  type: "#C8A2FF",
  number: "#F2C14E",
  punctuation: "#7E8AA3",
  property: "#A9D4FF",
  plain: "#C9D1E0",
} as const;

export interface Token {
  text: string;
  color: string;
}
export type Line = Token[];

export interface MorphExample {
  /** Operation label, used in the sr-only description. */
  name: string;
  /** Generated output file path (controller folder + apis.ts), shown in the pane title. */
  outputPath: string;
  input: Line[];
  output: Line[];
}

const { keyword: k, string: s, function: fn, type: t, punctuation: p, property: prop, plain } = SYNTAX;

export const EXAMPLES: MorphExample[] = [
  {
    name: "getContact",
    outputPath: "contact/apis.ts",
    input: [
      [{ text: "{", color: p }],
      [
        { text: "  ", color: plain },
        { text: '"/api/v1/contacts/{contactId}"', color: prop },
        { text: ": {", color: p },
      ],
      [
        { text: "    ", color: plain },
        { text: '"get"', color: prop },
        { text: ": {", color: p },
      ],
      [
        { text: "      ", color: plain },
        { text: '"tags"', color: prop },
        { text: ": [", color: p },
        { text: '"Contact"', color: s },
        { text: "],", color: p },
      ],
      [
        { text: "      ", color: plain },
        { text: '"operationId"', color: prop },
        { text: ": ", color: p },
        { text: '"getContact"', color: s },
      ],
      [{ text: "    }", color: p }],
      [{ text: "  }", color: p }],
      [{ text: "}", color: p }],
    ],
    output: [
      [
        { text: "export ", color: k },
        { text: "const ", color: k },
        { text: "getContact", color: fn },
        { text: " = (", color: p },
        { text: "{ contactId }", color: plain },
        { text: ": {", color: p },
      ],
      [
        { text: "  contactId", color: plain },
        { text: ": ", color: p },
        { text: "number", color: t },
        { text: " }) =>", color: p },
      ],
      [
        { text: "  client", color: plain },
        { text: ".", color: p },
        { text: "get", color: fn },
        { text: "<", color: p },
        { text: "CommonResponse", color: t },
        { text: "<", color: p },
        { text: "Detail", color: t },
        { text: ">>(", color: p },
      ],
      [
        { text: "    `/api/v1/contacts/", color: s },
        { text: "${contactId}", color: plain },
        { text: "`", color: s },
        { text: ")", color: p },
      ],
      [
        { text: "    .", color: p },
        { text: "then", color: fn },
        { text: "((res) => res", color: plain },
        { text: ".", color: p },
        { text: "data", color: prop },
        { text: ".", color: p },
        { text: "data", color: prop },
        { text: ");", color: p },
      ],
    ],
  },
  {
    name: "createContact",
    outputPath: "contact/apis.ts",
    input: [
      [{ text: "{", color: p }],
      [
        { text: "  ", color: plain },
        { text: '"/api/v1/contacts"', color: prop },
        { text: ": {", color: p },
      ],
      [
        { text: "    ", color: plain },
        { text: '"post"', color: prop },
        { text: ": {", color: p },
      ],
      [
        { text: "      ", color: plain },
        { text: '"tags"', color: prop },
        { text: ": [", color: p },
        { text: '"Contact"', color: s },
        { text: "],", color: p },
      ],
      [
        { text: "      ", color: plain },
        { text: '"operationId"', color: prop },
        { text: ": ", color: p },
        { text: '"createContact"', color: s },
      ],
      [{ text: "    }", color: p }],
      [{ text: "  }", color: p }],
      [{ text: "}", color: p }],
    ],
    output: [
      [
        { text: "export ", color: k },
        { text: "const ", color: k },
        { text: "createContact", color: fn },
        { text: " = (", color: p },
        { text: "{ body }", color: plain },
        { text: ": {", color: p },
      ],
      [
        { text: "  body", color: plain },
        { text: ": ", color: p },
        { text: "Create", color: t },
        { text: " }) =>", color: p },
      ],
      [
        { text: "  client", color: plain },
        { text: ".", color: p },
        { text: "post", color: fn },
        { text: "<", color: p },
        { text: "CommonResponse", color: t },
        { text: "<", color: p },
        { text: "Create", color: t },
        { text: ">>(", color: p },
      ],
      [
        { text: "    `/api/v1/contacts`", color: s },
        { text: ", body)", color: plain },
      ],
      [
        { text: "    .", color: p },
        { text: "then", color: fn },
        { text: "((res) => res", color: plain },
        { text: ".", color: p },
        { text: "data", color: prop },
        { text: ".", color: p },
        { text: "data", color: prop },
        { text: ");", color: p },
      ],
    ],
  },
  {
    name: "uploadAvatar",
    outputPath: "users/apis.ts",
    input: [
      [{ text: "{", color: p }],
      [
        { text: "  ", color: plain },
        { text: '"/users/{id}/avatar"', color: prop },
        { text: ": {", color: p },
      ],
      [
        { text: "    ", color: plain },
        { text: '"post"', color: prop },
        { text: ": {", color: p },
      ],
      [
        { text: "      ", color: plain },
        { text: '"operationId"', color: prop },
        { text: ": ", color: p },
        { text: '"uploadAvatar"', color: s },
        { text: ",", color: p },
      ],
      [
        { text: "      ", color: plain },
        { text: '"requestBody"', color: prop },
        { text: ": ", color: p },
        { text: '"multipart/form-data"', color: s },
      ],
      [{ text: "    }", color: p }],
      [{ text: "  }", color: p }],
      [{ text: "}", color: p }],
    ],
    output: [
      [
        { text: "export ", color: k },
        { text: "const ", color: k },
        { text: "uploadAvatar", color: fn },
        { text: " = (", color: p },
        { text: "{ id, body }", color: plain },
        { text: ") => {", color: p },
      ],
      [
        { text: "  const ", color: k },
        { text: "formData", color: plain },
        { text: " = ", color: p },
        { text: "new ", color: k },
        { text: "FormData", color: t },
        { text: "();", color: p },
      ],
      [
        { text: "  Object", color: plain },
        { text: ".", color: p },
        { text: "entries", color: fn },
        { text: "(body).", color: plain },
        { text: "forEach", color: fn },
        { text: "(/* … */);", color: p },
      ],
      [
        { text: "  return ", color: k },
        { text: "client", color: plain },
        { text: ".", color: p },
        { text: "post", color: fn },
        { text: "<", color: p },
        { text: "User", color: t },
        { text: ">(url, formData)", color: p },
      ],
      [
        { text: "    .", color: p },
        { text: "then", color: fn },
        { text: "((res) => res", color: plain },
        { text: ".", color: p },
        { text: "data", color: prop },
        { text: ");", color: p },
      ],
    ],
  },
];
