// Função para decodificar Base64 em UTF-8
export function base64ToUtf8(base64: string): string{
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
}

// Função para codificar UTF-8 em Base64
export function utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary)
}

