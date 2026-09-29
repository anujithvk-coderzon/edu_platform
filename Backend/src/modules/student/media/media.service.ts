import axios from "axios";
import { BadRequestError } from "../../../errors/Errors";
import {
  BUNNY_STORAGE_HOST,
  parseAllowedMediaUrl,
} from "../../../lib/mediaHosts";

const FETCH_TIMEOUT_MS = 30_000;

/**
 * Fetch a PDF on the client's behalf so react-pdf is not blocked by CORS.
 *
 * Only this deployment's own media hosts are fetched — an open proxy here
 * would be an SSRF primitive against the server's network, and a substring
 * host check would leak the storage key to an attacker-controlled host.
 */
export const fetchPdfService = async (rawUrl: string) => {
  const target = parseAllowedMediaUrl(rawUrl);
  if (!target) {
    throw new BadRequestError("Invalid PDF URL");
  }

  const headers: Record<string, string> = { Accept: "application/pdf" };

  // The access key goes ONLY to Bunny Storage, matched on exact hostname.
  if (target.hostname.toLowerCase() === BUNNY_STORAGE_HOST) {
    const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
    if (accessKey) headers.AccessKey = accessKey;
  }

  const response = await axios.get(target.toString(), {
    responseType: "arraybuffer",
    headers,
    timeout: FETCH_TIMEOUT_MS,
  });

  return response.data as Buffer;
};
