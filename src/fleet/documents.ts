export type DocKind =
  | "selfie"
  | "passport"
  | "license_front"
  | "license_back"
  | "registration"
  | "insurance"
  | "vehicle_photo";

export type UploadedDoc = {
  kind: DocKind;
  path: string;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
};

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;
const MIN_EDGE = 400;

export const WALKING_DOCS: DocKind[] = ["selfie", "passport"];
export const VEHICLE_DOCS: DocKind[] = [
  "selfie",
  "passport",
  "license_front",
  "license_back",
  "registration",
  "vehicle_photo"
];

export function validateUpload(doc: UploadedDoc): string | null {
  if (!IMAGE_TYPES.has(doc.mime)) return "unsupported_type";
  if (doc.bytes <= 0 || doc.bytes > MAX_BYTES) return "size";
  if (doc.path.includes("..") || doc.path.startsWith("/")) return "path";
  if ((doc.width && doc.width < MIN_EDGE) || (doc.height && doc.height < MIN_EDGE)) return "too_small";
  return null;
}

export function missingDocs(track: "walking" | "vehicle", uploaded: UploadedDoc[]): DocKind[] {
  const required = track === "walking" ? WALKING_DOCS : VEHICLE_DOCS;
  const have = new Set(uploaded.filter((doc) => !validateUpload(doc)).map((doc) => doc.kind));
  return required.filter((kind) => !have.has(kind));
}

export function docsReady(track: "walking" | "vehicle", uploaded: UploadedDoc[]): boolean {
  return missingDocs(track, uploaded).length === 0;
}
