export {}

declare global {
  interface Window {
    jobflow: {
      app: {
        getVersion: () => Promise<string>
      }
    }
  }
}
