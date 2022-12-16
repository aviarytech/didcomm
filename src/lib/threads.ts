export class DIDCommThreads {
  private threads: {id: string, me: string}[];
  
  constructor() {
    this.threads = [];
  }

  get length() {
    return this.threads.length
  }

  get all() {
    return this.threads;
  }

  getThreadById = (id: string): {id: string, me: string} | null => {
    return this.threads.find(t => t.id === id) ?? null
  }

  addThread = (id: string, me: string) => {
    if (this.threads.findIndex(t => t.id === id) < 0) {
      this.threads = [...this.threads, {id, me}]
    }
  }

  removeThread = (id: string | undefined) => {
    this.threads = this.threads.filter(t => t.id !== id)
  }
}