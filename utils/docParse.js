const pdfjs = require('pdfjs-dist');
const textract = require('textract')

async function parsePDF(buffer) {
    //Parse buffer and get pdf metaData
    const data = new Uint8Array(buffer);
    const pdf = await pdfjs.getDocument(data).promise;
    let totalWords = 0; //Holds the total no of words in the pdf
    let content = [] //Contains the word contain for each page in the pdf

    //To understand what is going on this for loop, log the content of the pdf variable above, console.log(pdf)
    for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const items = (await page.getTextContent()).items;
        const pageText = items.map(item => item.str).join(' ');
        content.push(pageText)

        const pageWords = items.reduce((acc, each) => {
            if (each.width !== 0 && each.height !== 0) {
                acc += each.str.split(' ').length;
            }
            return acc
        }, 0)

        totalWords += pageWords;
    }
    content = [content.join(' ')] //Outputs an array with only one element which is the total string content of the entire pdf

    return {
        totalWords,
        content
    };
}


async function parseDocx(fileType, buffer) {
    return new Promise((resolve, reject) => {
        textract.fromBufferWithMime(fileType, buffer, (error, content) => {
            if (error) {
                reject(error);
            } else {
                const totalWords = content.split(/\s+/).length;
                content = [content];
                const data = {
                    totalWords,
                    content,
                };
                resolve(data);
            }
        });
    });
}


module.exports = {
    parsePDF,
    parseDocx
}