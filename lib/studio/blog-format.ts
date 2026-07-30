// BS-3b — the blog sanitizer, wired. THIS FILE HAS NO LOGIC.
//
// It imports the shared field combinators from sections-format (ONE implementation of
// the drift-prone validation — the frame enum, the http(s) URL rule), hands them to the
// factory in blog-format-core, and re-exports the result. Routes import from here and
// never see a combinator.
//
// The split exists because blog-format-core must stay a dependency-free leaf so ralph
// can unit-test it: the suites run under `node --experimental-strip-types`, which cannot
// resolve an extensionless relative TS import, and a `.ts` specifier (which node WOULD
// resolve) is rejected by tsc under moduleResolution "bundler". Injection is the repo's
// established answer to that — see rich-markers.ts, which injects isSafeHref for exactly
// this reason. There is nothing to test in this file, which is the point of it.
//
// A STANDING CONSTRAINT, now hit twice (3a's keystatic.config mirror was the first):
// a lib module that ralph must unit-test cannot carry an extensionless relative TS
// import. Either keep it a dependency-free leaf, or inject its dependencies.
import {
  str,
  obj,
  arrayOf,
  imgSpec,
  videoSrc,
  videoFrame,
  bool,
  imageSrc,
} from "./sections-format";
import { makeBlogSanitizers } from "./blog-format-core";

const sanitizers = makeBlogSanitizers({ str, obj, arrayOf, imgSpec, videoSrc, videoFrame, bool, imageSrc });

export const sanitizeBlogBlocksPatch = sanitizers.sanitizeBlogBlocksPatch;
export const sanitizeBlogPatch = sanitizers.sanitizeBlogPatch;
export const sanitizeBlogCreate = sanitizers.sanitizeBlogCreate;

export {
  BLOG_STATUSES,
  BLOG_TOPICS,
  type BlogStatus,
  type BlogTopic,
  type BlogInput,
  type BlogCreateInput,
} from "./blog-format-core";
