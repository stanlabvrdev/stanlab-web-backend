import { Response } from "express";

export function streamResponse(data: string, res: Response) {
  const dataChunks = data.split("");
  function writeNextChunk() {
    if (dataChunks.length === 0) {
      res.end();
    } else {
      setTimeout(() => {
        res.write(dataChunks.shift());
        writeNextChunk();
      }, 7);
    }
  }
  writeNextChunk();
}
