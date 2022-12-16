export class DIDCommThreads {
  private threads: {id: string, me: string}[];
  
  constructor() {
    this.threads = [];
  }

  get length() {
    return this.threads.length
  }

  getThreadById = (id: string): {id: string, me: string} | null => {
    return this.threads.find(t => t.id === id) ?? null
  }

  addThread = (id: string, me: string) => {
    this.threads = [...this.threads, {id, me}]
  }

  removeThread = (id: string | undefined) => {
    this.threads = this.threads.filter(t => t.id !== id)
  }
}