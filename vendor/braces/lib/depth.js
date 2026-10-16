'use strict';

// Bound both parsed patterns and externally supplied ASTs before recursion.
const MAX_DEPTH = 100;
const assertDepth = depth => {
  if (depth > MAX_DEPTH) {
    throw new SyntaxError(`Brace nesting exceeds maximum depth (${MAX_DEPTH})`);
  }
};

module.exports = { MAX_DEPTH, assertDepth };
