/* ==========================================================================
   CAPA Peer Support Directory — settings
   --------------------------------------------------------------------------
   This is the only file you need to edit to point the directory at CAPA's
   real addresses. Everything marked TODO must be filled in before launch.
   Keep the quote marks around each value.
   ========================================================================== */

window.CAPA_CONFIG = {

  // TODO: the address that "Suggest a group / report an outdated listing" writes to.
  contactEmail: "info@arthritispatient.ca",

  // TODO: link used in the empty state and the footer.
  resourcesUrl: "https://arthritispatient.ca/useful-resources/",

  // Where the CAPA logo links back to.
  homeUrl: "https://arthritispatient.ca/",

  // A listing older than this many months shows a quiet "please double-check" note.
  staleAfterMonths: 12,

  // Where the listings live, relative to index.html.
  dataUrl: "data/groups.json"
};
