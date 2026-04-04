; tags.scm — Code navigation tags for Moon
; Used by editors and code intelligence tools for symbol indexing.

; ──────────────────────────────────────────────
;  Definitions
; ──────────────────────────────────────────────

(function_definition
  name: (identifier) @name) @definition.function

(struct_definition
  name: (identifier) @name) @definition.type

(enum_definition
  name: (identifier) @name) @definition.type

(interface_definition
  name: (identifier) @name) @definition.interface

(type_alias
  name: (identifier) @name) @definition.type

(extern_declaration
  name: (identifier) @name) @definition.function

(interface_method
  name: (identifier) @name) @definition.method

(variant
  name: (identifier) @name) @definition.constant

(field_declaration
  name: (identifier) @name) @definition.field

; ──────────────────────────────────────────────
;  References
; ──────────────────────────────────────────────

(call_expression
  function: (identifier) @name) @reference.call

(call_expression
  function: (path_expression (identifier) @name .)) @reference.call

(method_call_expression
  method: (identifier) @name) @reference.call

(named_type
  (identifier) @name) @reference.type

(struct_literal
  name: (identifier) @name) @reference.type

(struct_pattern
  name: (identifier) @name) @reference.type

(use_declaration
  (use_path (identifier) @name .)) @reference.module
