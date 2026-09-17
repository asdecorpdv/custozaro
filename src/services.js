/* Demo adapters. Replace these interfaces with server-backed implementations. */
window.ForgeServices = (() => {
  let session = null;
  const auth = {
    current: () => session,
    async signIn(email, password) {
      email = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) throw new Error('Informe e-mail válido e senha fictícia.');
      // This identifier is only a local partition, never proof of identity.
      session = { userId: `demo:${email}`, tenantId: `demo:${email}`, email, mode: 'demo' };
      return session;
    },
    async signOut() { session = null; }
  };
  const key = s => `forgecost_v3:${encodeURIComponent(s.tenantId)}:${encodeURIComponent(s.userId)}`;
  function validate(data) {
    if (!data || !Array.isArray(data.products) || !Array.isArray(data.inputs) || !Array.isArray(data.categories) || !Array.isArray(data.history) || !data.laborSettings) throw new Error('Arquivo de dados inválido.');
    return data;
  }
  const repository = {
    async load(s, defaults) {
      const raw = localStorage.getItem(key(s));
      if (raw) {
        const record = JSON.parse(raw);
        if (record.tenantId !== s.tenantId || record.userId !== s.userId) throw new Error('Workspace incompatível.');
        return validate(record.data);
      }
      return structuredClone(defaults);
    },
    save(s, data) {
      if (!s) throw new Error('Entre na demonstração para salvar.');
      localStorage.setItem(key(s), JSON.stringify({version:3, tenantId:s.tenantId,userId:s.userId,updatedAt:new Date().toISOString(),data:validate(data)}));
    },
    legacy() { const raw=localStorage.getItem('forgecost_v2');return raw ? validate(JSON.parse(raw)) : null; },
    validate
  };
  return {auth,repository};
})();
