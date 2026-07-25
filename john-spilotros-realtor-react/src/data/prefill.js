/* Any page can pre-write a message for the Contact form. The message rides in
   sessionStorage; the Contact page picks it up on mount. Callers navigate to
   /contact themselves (react-router navigate or Link). */
export function prefillContact(message) {
  try { sessionStorage.setItem('prefill-contact', message); } catch (e) { /* private mode */ }
}
