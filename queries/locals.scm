; locals.scm — Scope and variable resolution for Moon

; ──────────────────────────────────────────────
;  Scopes
; ──────────────────────────────────────────────

(source_file) @local.scope

(function_definition) @local.scope
(block) @local.scope
(for_statement) @local.scope
(while_statement) @local.scope
(if_expression) @local.scope
(match_arm) @local.scope
(closure_expression) @local.scope
(unsafe_block) @local.scope

; ──────────────────────────────────────────────
;  Definitions
; ──────────────────────────────────────────────

; Function name defines a symbol in the outer scope
(function_definition name: (identifier) @local.definition)

; Parameters are definitions inside the function scope
(parameter name: (identifier) @local.definition)

; Let bindings
(let_statement pattern: (identifier_pattern (identifier) @local.definition))

; For-loop pattern variable
(for_statement pattern: (identifier_pattern (identifier) @local.definition))

; Match arm pattern bindings
(identifier_pattern (identifier) @local.definition)

; Closure parameters
(closure_expression (closure_parameters (closure_parameter name: (identifier) @local.definition)))

; Struct/enum/interface definitions
(struct_definition name: (identifier) @local.definition)
(enum_definition name: (identifier) @local.definition)
(interface_definition name: (identifier) @local.definition)
(type_alias name: (identifier) @local.definition)

; ──────────────────────────────────────────────
;  References
; ──────────────────────────────────────────────

(identifier) @local.reference
