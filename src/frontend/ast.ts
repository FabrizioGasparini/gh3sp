export type NodeType =
    //Statements
    | "Program"
    | "VariableDeclaration"
    | "FunctionDeclaration"
    | "IfStatement"
    | "ForStatement"
    | "WhileStatement"

    // Expressions
    | "AssignmentExpression"
    | "CompoundAssignmentExpression"
    | "BinaryExpression"
    | "MemberExpression"
    | "CallExpression"
    // Literals
    | "ObjectLiteral"
    | "Property"
    | "NumericLiteral"
    | "StringLiteral"
    | "BooleanLiteral"
    | "Identifier";

export interface Statement {
    kind: NodeType;
}

export interface Program extends Statement {
    kind: "Program";
    body: Statement[];
}

export interface VariableDeclaration extends Statement {
    kind: "VariableDeclaration";
    constant: boolean;
    identifier: string;
    value?: Expression;
}

export interface FunctionDeclaration extends Statement {
    kind: "FunctionDeclaration";
    parameters: string[];
    name: string;
    body: Statement[];
}

export interface Expression extends Statement {}

export interface AssignmentExpression extends Expression {
    kind: "AssignmentExpression";
    assigne: Expression;
    value: Expression;
}

export interface CompoundAssignmentExpression extends Expression {
    kind: "CompoundAssignmentExpression";
    assigne: Expression;
    value: Expression;
    operator: string;
}

export interface BinaryExpression extends Expression {
    kind: "BinaryExpression";
    left: Expression;
    right: Expression;
    operator: string;
}
export interface CallExpression extends Expression {
    kind: "CallExpression";
    args: Expression[];
    caller: Expression;
}

export interface MemberExpression extends Expression {
    kind: "MemberExpression";
    object: Expression;
    property: Expression;
    computed: boolean;
}

export interface IfStatement extends Expression {
    kind: "IfStatement";
    condition: Expression;
    then: Statement[];
    else?: Statement[];
}

export interface WhileStatement extends Expression {
    kind: "WhileStatement";
    condition: Expression;
    body: Statement[];
}

export interface ForStatement extends Expression {
    kind: "ForStatement";
    assignment: AssignmentExpression | VariableDeclaration;
    declared: boolean;
    condition: Expression;
    compoundAssignment: CompoundAssignmentExpression;
    body: Statement[];
}

export interface Identifier extends Expression {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expression {
    kind: "NumericLiteral";
    value: number;
}

export interface StringLiteral extends Expression {
    kind: "StringLiteral";
    value: string;
}

export interface BooleanLiteral extends Expression {
    kind: "BooleanLiteral";
    value: boolean;
}

export interface ObjectLiteral extends Expression {
    kind: "ObjectLiteral";
    properties: Property[];
}

export interface Property extends Expression {
    kind: "Property";
    key: string;
    value?: Expression;
}