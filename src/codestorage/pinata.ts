import fs from "fs";
import { ToContent } from "ipfs-core-types/src/utils";
// @ts-ignore
import { of } from "ipfs-only-hash";
import { Readable } from "stream";
import { PinataSDK } from "pinata";
import { CodeStorageProvider, FileUploadSpec } from "./provider";

export class Pinata implements CodeStorageProvider {
  #pinata: PinataSDK;
  #gateway: string;

  constructor(jwt: string, gateway?: string) {
    this.#pinata = new PinataSDK({ pinataJwt: jwt });
    this.#gateway = gateway || "gateway.pinata.cloud";
  }

  async hashForContent(content: ToContent[]): Promise<string[]> {
    return Promise.all(content.map((c) => of(c)));
  }

  async writeFromContent(files: ToContent[], pin: boolean): Promise<string[]> {
    return Promise.all(
      files.map(async (f) => {
        // Convert ToContent to a File-like object that Pinata SDK can handle
        let fileData: Buffer;
        if (Buffer.isBuffer(f)) {
          fileData = f;
        } else if (f instanceof Readable) {
          // Read stream into buffer
          const chunks: Buffer[] = [];
          for await (const chunk of f) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          fileData = Buffer.concat(chunks);
        } else {
          // Convert other types to buffer
          fileData = Buffer.from(f.toString());
        }

        // Create a File from the buffer
        const file = new File([fileData], "file");
        const result = await this.#pinata.upload.public.file(file);
        return `ipfs://${result.cid}`;
      }),
    );
  }

  async write(files: FileUploadSpec[], pin: boolean): Promise<string[]> {
    return Promise.all(
      files.map(async (fileSpec) => {
        // Read the file from the filesystem
        const fileData = await fs.promises.readFile(fileSpec.path);
        const file = new File([fileData], fileSpec.name);
        const result = await this.#pinata.upload.public.file(file);
        return `ipfs://${result.cid}`;
      }),
    );
  }

  async read(pointer: string): Promise<string> {
    const hash = pointer.replace("ipfs://", "");
    return (await fetch(`https://${this.#gateway}/ipfs/${hash}`)).text();
  }
}
