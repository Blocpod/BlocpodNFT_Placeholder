export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.info("[security-runtime]", process.version);
  }
}
