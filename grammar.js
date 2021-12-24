const NEWLINE = /\r?\n/;
const WHITE_SPACE = /[\t\f\v ]+/;
const ANYTHING = /[^\r\n]+/;

const PREC = {
  COMMAND: 50,
  FILE_CHANGE: 47,
  INDEX: 45,
  SIMILARITY: 43,
  FILE: 40,
  LOCATION: 35,
  ADDITION: 30,
  DELETION: 25,
};

const COMMAND_PRELUDE = token.immediate(prec(PREC.COMMAND, "diff"));
const FILE_CHANGE_PRELUDE = token.immediate(
  prec(PREC.FILE_CHANGE, field("kind", choice("new", "deleted", "rename")))
);
const INDEX_PRELUDE = token.immediate(prec(PREC.INDEX, "index"));
const SIMILARITY_PRELUDE = token.immediate(prec(PREC.SIMILARITY, "similarity"));
const FILE_PRELUDE = token.immediate(
  prec(PREC.FILE, field("kind", choice("---", "+++")))
);
const LOCATION_PRELUDE = token.immediate(prec(PREC.LOCATION, "@@"));
const ADDITION_PRELUDE = token.immediate(prec(PREC.ADDITION, "+"));
const DELETION_PRELUDE = token.immediate(prec(PREC.DELETION, "-"));

module.exports = grammar({
  name: "gitdiff",

  extras: ($) => [WHITE_SPACE],

  rules: {
    source: ($) => repeat(seq($._line, NEWLINE)),

    _line: ($) =>
      choice(
        $.command,
        $.file_change,
        $.index,
        $.similarity,
        $.file,
        $.location,
        $.addition,
        $.deletion,
        $.context
      ),

    command: ($) => seq(COMMAND_PRELUDE, "--git", $.filename),

    file_change: ($) =>
      choice(
        seq(FILE_CHANGE_PRELUDE, "file", "mode", $.mode),
        seq(FILE_CHANGE_PRELUDE, choice("from", "to"), $.filename)
      ),

    index: ($) =>
      seq(INDEX_PRELUDE, $.commit, "..", $.commit, optional($.mode)),

    similarity: ($) => seq(SIMILARITY_PRELUDE, "index", field("score", /\d+%/)),

    file: ($) => seq(FILE_PRELUDE, $.filename),

    location: ($) =>
      seq(LOCATION_PRELUDE, $.linerange, $.linerange, "@@", ANYTHING),

    addition: ($) => seq(ADDITION_PRELUDE, optional(ANYTHING)),

    deletion: ($) => seq(DELETION_PRELUDE, optional(ANYTHING)),

    context: ($) => token(prec(-1, ANYTHING)),

    linerange: ($) => /[-\+]\d+,\d+/,
    filename: ($) => ANYTHING,
    commit: ($) => /[a-f0-9]{7,40}/,
    mode: ($) => /\d+/,
  },
});
