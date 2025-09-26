function normalizePhone(s) {
    if (!s) return '';
    return s.replace(/\s+/g, '').replace(/[()\-\u00A0]/g, ''); // no spaces, parens, dashes, nbsp
  }
  
  function extractOtp(text) {
    if (!text) return null;
    const m = String(text).match(/(?<!\d)\d{4,8}(?!\d)/);
    return m ? m[0] : null;
  }
  
  function toIso(tsLike) {
    // best-effort; returns ISO or now()
    const d = new Date(tsLike);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  
  module.exports = { normalizePhone, extractOtp, toIso };
  