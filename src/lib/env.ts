export const env = {
  gatewayHttpUrl:
    import.meta.env.VITE_GATEWAY_HTTP_URL ?? "http://localhost:8080",
  gatewayWsUrl: import.meta.env.VITE_GATEWAY_WS_URL ?? "ws://localhost:8080/ws",
  useMock: (import.meta.env.VITE_USE_MOCK ?? "true") === "true",
} as const;
