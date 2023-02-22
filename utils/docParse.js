const textract = require('textract')
const PDFParser = require('pdf-parse');

async function parsePDF(buffer) {
    //Can pass certain options but options not necessary for me
    try {
        let content = await PDFParser(buffer);
        const totalWords = content.text.split(/\s+/).length;
        content = [content.text]
        const data = {
            content,
            totalWords
        }
        return data;
    } catch (err) {
        throw err
    }
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

//Splits large data into an array 500 word elements.
const splitTo500 = (text) => {
    //Split incoming text into an array
    const wordArr = text.split(' ')
    let chunkSize = 500
    //Split the array into individual arrays of 500 words each except the last portion which may not be up to 500 words
    const arrOf500WordsEach = wordArr.reduce((acc, val, index) => {
        if (index % chunkSize === 0) {
            acc.push(wordArr.slice(index, (index + chunkSize)))
        }
        return acc;
    }, [])
    let output = arrOf500WordsEach.map(each => each.join(' '))
    return output
}


module.exports = {
    parsePDF,
    parseDocx,
    splitTo500
}