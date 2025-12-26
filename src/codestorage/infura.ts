import { create, IPFSHTTPClient } from "ipfs-http-client";
import fs from "fs";
// @ts-ignore
import { of } from "ipfs-only-hash";
import { CodeStorageProvider, FileUploadSpec } from "./provider";
import { ToContent } from "ipfs-core-types/src/utils";
export class Infura implements CodeStorageProvider {
  #client: IPFSHTTPClient;

  constructor(infuraId: string, infuraSecret: string) {
    const auth = "Basic " + Buffer.from(infuraId + ":" + infuraSecret).toString("base64");

    this.#client = create({
      url: "https://ipfs.infura.io:5001/api/v0",
      headers: {
        authorization: auth,
      },
    });
  }

  async hashForContent(content: ToContent[]): Promise<string[]> {
    return Promise.all(content.map((c) => of(c)));
  }

  async writeFromContent(files: ToContent[], pin: boolean): Promise<string[]> {
    return Promise.all(
      files.map((f) =>
        this.#client.add({ content: f }, { pin }).then((r) => {
          return `ipfs://${r.cid.toString()}`;
        }),
      ),
    );
  }

  async write(files: FileUploadSpec[], pin: boolean): Promise<string[]> {
    return this.writeFromContent(
      files.map((f) => fs.createReadStream(f.path)),
      pin,
    );
  }

  async read(pointer: string): Promise<string> {
    return (
      await fetch(`https://${process.env.IPFS_PROVIDER}/ipfs/${pointer.replace("ipfs://", "")}`)
    ).text();
  }
}
