import { Response } from "express";

export function streamResponse(data: string, res: Response) {
  const dataChunks = data.split("");
  function writeNextChunk() {
    if (dataChunks.length === 0) {
      res.status(200).end();
    } else {
      setTimeout(() => {
        res.write(dataChunks.shift());
        writeNextChunk();
      }, 10);
    }
  }
  writeNextChunk();
}
