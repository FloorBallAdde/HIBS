// localStorage wrapper with JSON parse/stringify and error handling
const ls = {
  get: (k, fb) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fb;
    } catch {
      return fb;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  remove: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch {}
  },
};

export default ls;
