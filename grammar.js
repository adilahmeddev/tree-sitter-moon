/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Precedence levels (lowest to highest)
const PREC = {
  CLOSURE: -2,
  ASSIGN: 1,
  OR: 2,
  AND: 3,
  EQ: 4,
  CMP: 5,
  RANGE: 6,
  ADD: 7,
  MUL: 8,
  UNARY: 9,
  POSTFIX: 10,
};

module.exports = grammar({
  name: "moon",

  extras: ($) => [/\s/, $.line_comment],

  word: ($) => $.identifier,

  supertypes: ($) => [$.item, $.expression, $.statement, $.type, $.pattern, $.literal],

  conflicts: ($) => [
    // field_expression vs method_call_expression (both start with expr `.` ident)
    [$.field_expression, $.method_call_expression],
    [$.expression, $.struct_literal],
    // `x as Foo<T>` — ambiguity between `named_type` ending and `<` starting
    // type arguments when `as` is followed by an identifier.
    [$.named_type],
  ],

  rules: {
    // ──────────────────────────────────────────────
    //  Program
    // ──────────────────────────────────────────────

    source_file: ($) => repeat($.item),

    // ──────────────────────────────────────────────
    //  Items (top-level declarations)
    // ──────────────────────────────────────────────

    item: ($) =>
      choice(
        $.function_definition,
        $.struct_definition,
        $.enum_definition,
        $.type_alias,
        $.extern_declaration,
        $.directive,
        $.interface_definition,
        $.impl_definition,
        $.use_declaration,
        $.const_item,
      ),

    // Module-scope constant: `pub? (let | const) NAME (: TYPE)? = EXPR`
    const_item: ($) =>
      seq(
        optional("pub"),
        choice("const", "let"),
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        "=",
        field("value", $.expression),
      ),

    function_definition: ($) =>
      seq(
        optional("pub"),
        optional(choice("async", "const")),
        "fn",
        field("name", $.identifier),
        optional($.type_parameters),
        "(",
        field("parameters", optional($.parameter_list)),
        ")",
        optional(seq("->", field("return_type", $.type))),
        field("body", $.block),
      ),

    parameter_list: ($) =>
      seq($.parameter, repeat(seq(",", $.parameter)), optional(",")),

    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    struct_definition: ($) =>
      seq(
        optional("pub"),
        repeat($.struct_annotation),
        "struct",
        field("name", $.identifier),
        "{",
        optional($.field_list),
        "}",
      ),

    struct_annotation: (_) => choice("@C", "@packed"),

    field_list: ($) =>
      seq(
        $.field_declaration,
        repeat(seq(",", $.field_declaration)),
        optional(","),
      ),

    field_declaration: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    enum_definition: ($) =>
      seq(
        optional("pub"),
        "enum",
        field("name", $.identifier),
        optional($.type_parameters),
        "{",
        optional($.variant_list),
        "}",
      ),

    type_parameters: ($) =>
      seq("<", $.identifier, repeat(seq(",", $.identifier)), ">"),

    variant_list: ($) =>
      seq($.variant, repeat(seq(",", $.variant)), optional(",")),

    variant: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("(", $.type_list, ")")),
      ),

    type_list: ($) => seq($.type, repeat(seq(",", $.type))),

    type_alias: ($) =>
      seq(
        optional("pub"),
        "type",
        field("name", $.identifier),
        "=",
        field("type", $.type),
      ),

    extern_declaration: ($) =>
      seq(
        "extern",
        "fn",
        field("name", $.identifier),
        optional($.type_parameters),
        "(",
        field("parameters", optional($.parameter_list)),
        ")",
        optional(seq("->", field("return_type", $.type))),
      ),

    // Directives may optionally wrap their payload in parens:
    //   @include "foo.h"          @include("foo.h")
    //   @include <math.h>         @include(<math.h>)
    //   @link "m"                 @link_macos("Foundation")
    directive: ($) =>
      choice(
        seq(
          "@include",
          choice(
            field("path", choice($.string_literal, $.angle_path)),
            seq(
              "(",
              field("path", choice($.string_literal, $.angle_path)),
              ")",
            ),
          ),
        ),
        seq(
          choice("@link", "@link_macos", "@link_linux", "@link_windows"),
          choice(
            field("path", $.string_literal),
            seq("(", field("path", $.string_literal), ")"),
          ),
        ),
      ),

    // Angle-bracket include path: <math.h>
    angle_path: (_) => seq("<", /[^>]+/, ">"),

    interface_definition: ($) =>
      seq(
        optional("pub"),
        "interface",
        field("name", $.identifier),
        "{",
        repeat($.interface_method),
        "}",
      ),

    interface_method: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        optional($.type_parameters),
        "(",
        field("parameters", optional($.parameter_list)),
        ")",
        optional(seq("->", field("return_type", $.type))),
      ),

    impl_definition: ($) =>
      seq(
        "impl",
        choice(
          // impl Interface for Struct { ... }
          seq(
            field("interface", $.identifier),
            "for",
            field("type", $.identifier),
          ),
          // impl Struct { ... }
          field("type", $.identifier),
        ),
        "{",
        repeat($.function_definition),
        "}",
      ),

    use_declaration: ($) =>
      seq(optional("pub"), "use", $.use_path),

    use_path: ($) =>
      seq(
        $.identifier,
        repeat(seq("::", choice($.identifier, alias("*", $.wildcard_use)))),
      ),

    // ──────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────

    type: ($) =>
      choice(
        $.primitive_type,
        $.array_type,
        $.dict_type,
        $.tuple_type,
        $.function_type,
        $.pointer_type,
        $.future_type,
        $.optional_type,
        $.result_type,
        $.named_type,
      ),

    // `{ key_type: value_type }`
    dict_type: ($) =>
      seq(
        "{",
        field("key", $.type),
        ":",
        field("value", $.type),
        "}",
      ),

    primitive_type: (_) => choice("int", "float", "bool", "string", "void"),

    array_type: ($) => seq("[", field("element", $.type), "]"),

    tuple_type: ($) => seq("(", $.type_list, ")"),

    function_type: ($) =>
      seq(
        "fn",
        "(",
        optional($.type_list),
        ")",
        "->",
        field("return_type", $.type),
      ),

    pointer_type: ($) =>
      seq("*", optional("mut"), field("type", $.type)),

    future_type: ($) => seq("Future", "<", field("type", $.type), ">"),

    optional_type: ($) =>
      seq("Optional", "<", field("type", $.type), ">"),

    result_type: ($) => seq("Result", "<", field("type", $.type), ">"),

    named_type: ($) => seq($.identifier, optional($.type_arguments)),

    type_arguments: ($) =>
      seq("<", $.type, repeat(seq(",", $.type)), ">"),

    // ──────────────────────────────────────────────
    //  Blocks and Statements
    // ──────────────────────────────────────────────

    block: ($) => seq("{", repeat($.statement), "}"),

    statement: ($) =>
      choice(
        $.let_statement,
        $.return_statement,
        $.while_statement,
        $.for_statement,
        $.break_statement,
        $.continue_statement,
        $.expression_statement,
      ),

    let_statement: ($) =>
      seq(
        "let",
        optional("mut"),
        field("pattern", $._let_binding),
        optional(seq(":", field("type", $.type))),
        "=",
        field("value", $.expression),
      ),

    // What can appear after `let` / `let mut`
    _let_binding: ($) =>
      choice(
        $.wildcard_pattern,
        $.identifier_pattern,
        $.tuple_pattern,
        $.struct_pattern,
        $.array_pattern,
      ),

    return_statement: ($) =>
      prec.right(seq("return", optional($.expression))),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $.expression),
        field("body", $.block),
      ),

    for_statement: ($) =>
      seq(
        "for",
        field("pattern", $.pattern),
        "in",
        field("iterable", $.expression),
        field("body", $.block),
      ),

    break_statement: (_) => "break",

    continue_statement: (_) => "continue",

    expression_statement: ($) => seq($.expression, optional(";")),

    // ──────────────────────────────────────────────
    //  Expressions
    // ──────────────────────────────────────────────

    expression: ($) =>
      choice(
        $.assignment_expression,
        $.binary_expression,
        $.unary_expression,
        $.as_expression,
        $.await_expression,
        $.call_expression,
        $.method_call_expression,
        $.field_expression,
        $.tuple_index_expression,
        $.index_expression,
        $.try_expression,
        $.range_expression,
        $.closure_expression,
        $.struct_literal,
        $.tuple_expression,
        $.array_literal,
        $.dict_literal,
        $.some_expression,
        $.none_expression,
        $.ok_expression,
        $.err_expression,
        $.unsafe_block,
        $.block,
        $.if_expression,
        $.match_expression,
        $.path_expression,
        $.parenthesized_expression,
        $.literal,
        $.identifier,
      ),

    // Assignment: lvalue = expr (right-associative, lowest precedence).
    // An lvalue can be a bare identifier, a field access, or an index
    // expression. We reuse the full expression subrules for field/index so
    // complex chains like `a.b[0].c = x` still parse.
    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGN,
        seq(
          field(
            "left",
            choice($.identifier, $.field_expression, $.index_expression),
          ),
          "=",
          field("right", $.expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ["||", PREC.OR],
          ["&&", PREC.AND],
          ["==", PREC.EQ],
          ["!=", PREC.EQ],
          ["<", PREC.CMP],
          ["<=", PREC.CMP],
          [">", PREC.CMP],
          [">=", PREC.CMP],
          ["+", PREC.ADD],
          ["-", PREC.ADD],
          ["*", PREC.MUL],
          ["/", PREC.MUL],
          ["%", PREC.MUL],
        ].map(([op, prec_level]) =>
          prec.left(
            prec_level,
            seq(
              field("left", $.expression),
              field("operator", op),
              field("right", $.expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec(
        PREC.UNARY,
        seq(
          field("operator", choice("-", "!", "&")),
          field("operand", $.expression),
        ),
      ),

    // `expr as Type` — type cast. Left-associative, right below unary so
    // `!x as bool` parses as `!(x as bool)`.
    as_expression: ($) =>
      prec.left(
        PREC.UNARY - 1,
        seq(
          field("value", $.expression),
          "as",
          field("type", $.type),
        ),
      ),

    await_expression: ($) =>
      prec(PREC.UNARY, seq("await", field("expression", $.expression))),

    range_expression: ($) =>
      prec.left(
        PREC.RANGE,
        seq(
          field("start", $.expression),
          "..",
          field("end", $.expression),
        ),
      ),

    call_expression: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("function", $.expression),
          field("arguments", $.arguments),
        ),
      ),

    arguments: ($) =>
      seq(
        "(",
        optional(seq($.expression, repeat(seq(",", $.expression)))),
        ")",
      ),

    method_call_expression: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("receiver", $.expression),
          ".",
          field("method", choice($.identifier, alias("let", $.identifier))),
          field("arguments", $.arguments),
        ),
      ),

    field_expression: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("receiver", $.expression),
          ".",
          field("field", $.identifier),
        ),
      ),

    tuple_index_expression: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("receiver", $.expression),
          ".",
          field("index", $.integer_literal),
        ),
      ),

    index_expression: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          field("receiver", $.expression),
          "[",
          field("index", $.expression),
          "]",
        ),
      ),

    try_expression: ($) =>
      prec(PREC.POSTFIX, seq(field("expression", $.expression), "?")),

    if_expression: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.expression),
          field("consequence", $.block),
          optional(
            seq(
              "else",
              field("alternative", choice($.if_expression, $.block)),
            ),
          ),
        ),
      ),

    match_expression: ($) =>
      seq(
        "match",
        field("value", $.expression),
        "{",
        $.match_arm_list,
        "}",
      ),

    match_arm_list: ($) =>
      seq($.match_arm, repeat(seq(",", $.match_arm)), optional(",")),

    match_arm: ($) =>
      seq(
        field("pattern", $.pattern),
        optional(seq("if", field("guard", $.expression))),
        "=>",
        field("value", $.expression),
      ),

    closure_expression: ($) =>
      prec(
        PREC.CLOSURE,
        seq(
          "|",
          optional($.closure_parameters),
          "|",
          optional(seq("->", field("return_type", $.type))),
          field("body", $.expression),
        ),
      ),

    // Closure parameters can omit types: |x| or |x: int|
    closure_parameters: ($) =>
      seq(
        $.closure_parameter,
        repeat(seq(",", $.closure_parameter)),
        optional(","),
      ),

    closure_parameter: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
      ),

    tuple_expression: ($) =>
      seq("(", $.expression, ",", optional(seq($.expression, repeat(seq(",", $.expression)))), ")"),

    struct_literal: ($) =>
      prec.dynamic(
        1,
        seq(
          field("name", $.identifier),
          "{",
          optional($.field_init_list),
          "}",
        ),
      ),

    field_init_list: ($) =>
      seq(
        choice($.struct_base, $.field_initializer),
        repeat(seq(",", choice($.struct_base, $.field_initializer))),
        optional(","),
      ),

    // `...expr` inside a struct literal copies unspecified fields from `expr`.
    struct_base: ($) =>
      seq("...", field("base", $.expression)),

    field_initializer: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("value", $.expression),
      ),

    array_literal: ($) =>
      seq(
        "[",
        optional(seq($.expression, repeat(seq(",", $.expression)))),
        "]",
      ),

    // `{k: v, k2: v2}` or `{:}` for empty. Uses dynamic precedence to beat a
    // block expression when the contents fit `expr : expr, ...`.
    dict_literal: ($) =>
      prec.dynamic(
        2,
        seq(
          "{",
          choice(
            ":",
            seq(
              $.dict_entry,
              repeat(seq(",", $.dict_entry)),
              optional(","),
            ),
          ),
          "}",
        ),
      ),

    dict_entry: ($) =>
      seq(field("key", $.expression), ":", field("value", $.expression)),

    some_expression: ($) =>
      seq("some", "(", field("value", $.expression), ")"),

    none_expression: (_) => "none",

    ok_expression: ($) =>
      seq("ok", "(", field("value", $.expression), ")"),

    err_expression: ($) =>
      prec.left(
        seq(
          "err",
          ".",
          field("name", $.identifier),
          optional(seq("(", field("message", $.expression), ")")),
        ),
      ),

    unsafe_block: ($) => seq("unsafe", field("body", $.block)),

    path_expression: ($) =>
      seq($.identifier, repeat1(seq("::", $.identifier))),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    // ──────────────────────────────────────────────
    //  Patterns
    // ──────────────────────────────────────────────

    pattern: ($) =>
      choice(
        $.wildcard_pattern,
        $.literal,
        $.identifier_pattern,
        $.tuple_pattern,
        $.struct_pattern,
        $.enum_variant_pattern,
        $.array_pattern,
      ),

    wildcard_pattern: (_) => "_",

    identifier_pattern: ($) => $.identifier,

    tuple_pattern: ($) =>
      seq("(", $.pattern, repeat(seq(",", $.pattern)), ")"),

    struct_pattern: ($) =>
      seq(
        field("name", $.identifier),
        "{",
        $.field_pattern_list,
        "}",
      ),

    field_pattern_list: ($) =>
      seq(
        $.field_pattern,
        repeat(seq(",", $.field_pattern)),
        optional(","),
      ),

    field_pattern: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("pattern", $.pattern))),
      ),

    // Enum variant patterns take three forms:
    //   `::Variant`                  (shorthand; enum inferred from scrutinee)
    //   `Enum::Variant`              (fully qualified)
    //   `Variant(x, y)`              (bare; payload required to disambiguate from identifier_pattern)
    // Any of them can carry a `(pat, pat)` payload.
    enum_variant_pattern: ($) =>
      choice(
        seq(
          "::",
          field("name", $.identifier),
          optional(seq("(", optional($.pattern_list), ")")),
        ),
        seq(
          field("enum_name", $.identifier),
          "::",
          field("name", $.identifier),
          optional(seq("(", optional($.pattern_list), ")")),
        ),
        seq(
          field("name", $.identifier),
          "(",
          optional($.pattern_list),
          ")",
        ),
      ),

    pattern_list: ($) => seq($.pattern, repeat(seq(",", $.pattern))),

    array_pattern: ($) =>
      seq(
        "[",
        optional(
          choice(
            seq(
              $.pattern,
              repeat(seq(",", $.pattern)),
              optional(seq(",", "..", optional($.identifier))),
            ),
            seq("..", optional($.identifier)),
          ),
        ),
        "]",
      ),

    // ──────────────────────────────────────────────
    //  Literals
    // ──────────────────────────────────────────────

    literal: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.boolean_literal,
        $.string_literal,
      ),

    integer_literal: (_) => /[0-9]+/,

    float_literal: (_) => /[0-9]+\.[0-9]+/,

    boolean_literal: (_) => choice("true", "false"),

    string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(
            $.escape_sequence,
            $.string_interpolation,
            $.string_content,
          ),
        ),
        '"',
      ),

    string_content: (_) => token.immediate(prec(1, /[^"\\$]+/)),

    string_interpolation: ($) =>
      choice(
        // ${expr} form
        seq(
          token.immediate("${"),
          field("expression", $.expression),
          "}",
        ),
        // $name form
        seq(
          token.immediate("$"),
          field("expression", alias(token.immediate(/[a-zA-Z_][a-zA-Z0-9_]*/), $.identifier)),
        ),
      ),

    escape_sequence: (_) => token.immediate(/\\[ntr"\\$]/),

    // ──────────────────────────────────────────────
    //  Terminals
    // ──────────────────────────────────────────────

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    line_comment: (_) => token(seq("//", /[^\n]*/)),
  },
});
