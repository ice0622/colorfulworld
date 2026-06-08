declare module "heic2any" {
  type Options = {
    blob: Blob;
    toType?: string; // "image/jpeg" | "image/png" など
    quality?: number; // 0..1
  };
  export default function heic2any(options: Options): Promise<Blob | Blob[]>;
}
