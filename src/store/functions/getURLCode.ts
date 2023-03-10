export function getURLCode() {
  if (typeof window === "undefined") return;
  const url = new URLSearchParams(window.location.search);
  const code = url.get("code");
  if (code) {
    return code;
  }
}
