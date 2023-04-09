import textract from "textract";
import PDFParser from "pdf-parse";
import CustomError from "../services/exceptions/custom";

interface ParserInterface {
  parse(buffer: Buffer, fileType: string): Promise<string[]>;
}

class Parser {
  private content: string[];
  private totalWords: number;

  constructor() {
    this.content = [];
    this.totalWords = 0;
  }

  public async parse(buffer: Buffer, fileType: string): Promise<string[]> {
    let data: string[];
    if (fileType === "application/pdf") {
      data = await this.parsePDF(buffer);
      return this.splitTo500(data);
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      data = await this.parseDocx(buffer);
      return this.splitTo500(data);
    } else {
      throw new CustomError(400, "Unsupported file type");
    }
  }

  private async splitTo500(text: string[]): Promise<string[]> {
    //In the context where this method will be used as can be seen in the parse method of this class, the input which is returned from
    //...either parsePdf or parseDocx is an array containing a single element that is a string hence in the line below I extract that single string element
    const wordArr: string[] = text[0].split(" ");
    const chunkSize = 500;
    const arrOf500WordsEach = wordArr.reduce<string[][]>((acc, val, index) => {
      if (index % chunkSize === 0) {
        acc.push(wordArr.slice(index, index + chunkSize));
      }
      return acc;
    }, []);
    const output = arrOf500WordsEach.map((each) => each.join(" "));
    return output;
  }

  private async parsePDF(buffer: Buffer): Promise<string[]> {
    try {
      const initialContent = await PDFParser(buffer);
      this.totalWords = initialContent.text.split(/\s+/).length;
      this.content = [initialContent.text];
      if (this.totalWords > 2000) throw new CustomError(400, "Word limit exceeded, file should not contain more than 2000 words");
      return this.content;
    } catch (err) {
      throw err;
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string[]> {
    return new Promise((resolve, reject) => {
      textract.fromBufferWithMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer, (error, initialContent) => {
        if (error) {
          reject(error);
        } else {
          this.totalWords = initialContent.split(/\s+/).length;
          this.content = [initialContent];
          if (this.totalWords > 2000) reject(new CustomError(400, "Word limit exceeded, file should not contain more than 2000 words"));
          resolve(this.content);
        }
      });
    });
  }
}

const parser = new Parser();
export { ParserInterface, parser };
