type EdoBridgeCore = {
  init: (json: string) => void;
  setDocument: (json: string) => void;
  setStatus: (message: string) => void;
  setError: (message: string) => void;
};

declare global {
  interface Window {
    edoInit: (json: string) => void;
    edoSetDocument: (json: string) => void;
    edoSetStatus: (text: string) => void;
    edoSetError: (text: string) => void;
    __edoBridgeRegister: (core: EdoBridgeCore | undefined) => void;
    __edoBridgeCore?: EdoBridgeCore;
  }
}

const queue: Array<{ method: keyof EdoBridgeCore; arg: string }> = [];

function flush(): void {
  if (!window.__edoBridgeCore) {
    return;
  }
  while (queue.length > 0) {
    const item = queue.shift();
    if (item) {
      window.__edoBridgeCore[item.method](item.arg);
    }
  }
}

function enqueue(method: keyof EdoBridgeCore, arg: string): void {
  queue.push({ method, arg });
  flush();
}

window.__edoBridgeRegister = (core) => {
  window.__edoBridgeCore = core;
  flush();
};

window.edoInit = (json) => enqueue("init", json);
window.edoSetDocument = (json) => enqueue("setDocument", json);
window.edoSetStatus = (text) => enqueue("setStatus", text);
window.edoSetError = (text) => enqueue("setError", text);

export {};
