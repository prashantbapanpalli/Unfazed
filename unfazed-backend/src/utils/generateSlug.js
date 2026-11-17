const Therapist = require('../models/Therapist');

const slugify = (s) =>
  s.toLowerCase().replace(/^dr\.?\s+/, 'dr-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'therapist';

// Generates a URL-safe slug and makes sure it is unique (adds -2, -3 ... if needed).
module.exports = async function generateSlug(name) {
  const base = slugify(name);
  let slug = base;
  let i = 2;
  while (await Therapist.exists({ slug })) slug = `${base}-${i++}`;
  return slug;
};
module.exports.slugify = slugify;
