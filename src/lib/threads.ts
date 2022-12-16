export class DIDCommThreads {
  private threads: {id: string, me: string}[];
  
  constructor() {
    this.threads = [];
  }

  getThreadById = (id: string): {id: string, me: string} | null => {
    return this.threads.find(t => t.id === id) ?? null
  }

  addThread = (id: string, me: string) => {
    this.threads = [...this.threads, {id, me}]
  }

  removeThread = (id: string | undefined) => {
    if (id) {
      const idx = this.threads.findIndex(t => t.id === id)
      if (idx >= 0) {
        this.threads = [...this.threads.splice(idx, 1)]
      }
    }
  }
}