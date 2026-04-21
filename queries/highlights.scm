; highlights.scm — Tree-sitter syntax highlighting for Moon
; Capture names follow the conventions at:
; https://tree-sitter.github.io/tree-sitter/3-syntax-highlighting.html

; ──────────────────────────────────────────────
;  Comments
; ──────────────────────────────────────────────

(line_comment) @comment

; ──────────────────────────────────────────────
;  Literals
; ──────────────────────────────────────────────

(integer_literal) @number
(float_literal) @number.float
(boolean_literal) @boolean
(string_literal) @string
(string_content) @string
(string_interpolation) @string.special
(string_interpolation "${" @punctuation.special)
(string_interpolation "$" @punctuation.special)
(string_interpolation "}" @punctuation.special)
(escape_sequence) @string.escape

; ──────────────────────────────────────────────
;  Types
; ──────────────────────────────────────────────

(primitive_type) @type.builtin
(named_type (identifier) @type)
(future_type "Future" @type.builtin)
(optional_type "Optional" @type.builtin)
(result_type "Result" @type.builtin)
(array_type "[" @punctuation.bracket "]" @punctuation.bracket)
(tuple_type "(" @punctuation.bracket ")" @punctuation.bracket)
(function_type "fn" @keyword.function)
(pointer_type "*" @operator)
(pointer_type "mut" @keyword.modifier)
(type_arguments "<" @punctuation.bracket ">" @punctuation.bracket)
(type_parameters "<" @punctuation.bracket ">" @punctuation.bracket)

; ──────────────────────────────────────────────
;  Definitions
; ──────────────────────────────────────────────

; Functions
(function_definition "fn" @keyword.function)
(function_definition "async" @keyword.coroutine)
(function_definition "const" @keyword.modifier)
(function_definition "pub" @keyword.modifier)
(function_definition name: (identifier) @function)
(function_definition "->" @punctuation.delimiter)

; Module-scope constants (`pub? (const|let) NAME ...`)
(const_item "pub" @keyword.modifier)
(const_item "const" @keyword)
(const_item "let" @keyword)
(const_item name: (identifier) @constant)
(const_item ":" @punctuation.delimiter)

; Parameters
(parameter name: (identifier) @variable.parameter)

; Structs
(struct_definition "pub" @keyword.modifier)
(struct_definition "struct" @keyword.type)
(struct_definition name: (identifier) @type)
(struct_annotation) @attribute
(field_declaration name: (identifier) @property)

; Enums
(enum_definition "pub" @keyword.modifier)
(enum_definition "enum" @keyword.type)
(enum_definition name: (identifier) @type)
(variant name: (identifier) @constant)
(type_parameters (identifier) @type)

; Type aliases
(type_alias "pub" @keyword.modifier)
(type_alias "type" @keyword.type)
(type_alias name: (identifier) @type)

; Extern
(extern_declaration "extern" @keyword.modifier)
(extern_declaration "fn" @keyword.function)
(extern_declaration name: (identifier) @function)
(extern_declaration "->" @punctuation.delimiter)

; Interfaces
(interface_definition "pub" @keyword.modifier)
(interface_definition "interface" @keyword.type)
(interface_definition name: (identifier) @type)
(interface_method "fn" @keyword.function)
(interface_method name: (identifier) @function)
(interface_method "->" @punctuation.delimiter)

; Impl blocks
(impl_definition "impl" @keyword.type)
(impl_definition "for" @keyword.type)
(impl_definition interface: (identifier) @type)
(impl_definition type: (identifier) @type)

; Directives
(directive "@include" @attribute)
(directive "@link" @attribute)
(directive "@link_macos" @attribute)
(directive "@link_linux" @attribute)
(directive "@link_windows" @attribute)

; Use declarations
(use_declaration "pub" @keyword.modifier)
(use_declaration "use" @keyword.import)
(use_path (identifier) @module)
(use_path "::" @punctuation.delimiter)

; ──────────────────────────────────────────────
;  Statements
; ──────────────────────────────────────────────

(let_statement "let" @keyword)
(let_statement "mut" @keyword.modifier)
(let_statement pattern: (identifier_pattern) @variable)
(let_statement ":" @punctuation.delimiter)

(return_statement "return" @keyword.return)
(while_statement "while" @keyword.repeat)
(for_statement "for" @keyword.repeat)
(for_statement "in" @keyword.repeat)
(break_statement) @keyword.repeat
(continue_statement) @keyword.repeat

; ──────────────────────────────────────────────
;  Expressions
; ──────────────────────────────────────────────

; Binary operators
(binary_expression operator: _ @operator)

; Unary operators
(unary_expression operator: _ @operator)

; Assignment
(assignment_expression "=" @operator)

; Range
(range_expression ".." @operator)

; Calls
(call_expression function: (identifier) @function.call)
(call_expression function: (path_expression (identifier) @function.call .))

; Method calls
(method_call_expression method: (identifier) @function.method.call)

; Field access
(field_expression field: (identifier) @property)

; Tuple index
(tuple_index_expression "." @punctuation.delimiter)

; Index expression (subscript)
(index_expression "[" @punctuation.bracket "]" @punctuation.bracket)

; If/else
(if_expression "if" @keyword.conditional)
(if_expression "else" @keyword.conditional)

; Match
(match_expression "match" @keyword.conditional)
(match_arm "=>" @punctuation.delimiter)
(match_arm "if" @keyword.conditional)

; Closures
(closure_expression "|" @punctuation.bracket)
(closure_expression "->" @punctuation.delimiter)

; Struct literals
(struct_literal name: (identifier) @type)
(field_initializer name: (identifier) @property)
(struct_base "..." @punctuation.special)

; Array / dict literals
(array_literal "[" @punctuation.bracket "]" @punctuation.bracket)
(dict_literal "{" @punctuation.bracket "}" @punctuation.bracket)
(dict_literal ":" @punctuation.delimiter)
(dict_type "{" @punctuation.bracket "}" @punctuation.bracket)

; Option/Result constructors
(some_expression "some" @function.builtin)
(none_expression) @constant.builtin
(ok_expression "ok" @function.builtin)
(err_expression "err" @function.builtin)

; Unsafe
(unsafe_block "unsafe" @keyword.modifier)

; Await
(await_expression "await" @keyword.coroutine)

; Try (? operator)
(try_expression "?" @operator)

; `as` casts
(as_expression "as" @keyword.operator)

; Path expressions
(path_expression "::" @punctuation.delimiter)

; ──────────────────────────────────────────────
;  Patterns
; ──────────────────────────────────────────────

(wildcard_pattern) @variable.builtin
(identifier_pattern (identifier) @variable)
(struct_pattern name: (identifier) @type)
(field_pattern name: (identifier) @property)
(enum_variant_pattern name: (identifier) @constant)
(enum_variant_pattern enum_name: (identifier) @type)
(enum_variant_pattern "::" @punctuation.delimiter)
(array_pattern ".." @punctuation.special)

; ──────────────────────────────────────────────
;  Punctuation
; ──────────────────────────────────────────────

"(" @punctuation.bracket
")" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket

"," @punctuation.delimiter
":" @punctuation.delimiter
";" @punctuation.delimiter
"->" @punctuation.delimiter
"." @punctuation.delimiter
