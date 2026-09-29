/**
 * Fetch a PDF on the client's behalf so react-pdf is not blocked by CORS.
 *
 * Only this deployment's own media hosts are fetched — an open proxy here
 * would be an SSRF primitive against the server's network, and a substring
 * host check would leak the storage key to an attacker-controlled host.
 */
export declare const fetchPdfService: (rawUrl: string) => Promise<Buffer<ArrayBufferLike>>;
