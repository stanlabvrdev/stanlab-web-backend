import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { marked } from "marked";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export function sanitizeMarkdown(markdown: string) {
  const html = marked(markdown);
  const cleanHtml = DOMPurify.sanitize(html);

  return cleanHtml;
}
