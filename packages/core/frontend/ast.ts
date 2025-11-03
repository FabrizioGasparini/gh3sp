export type NodeType =
    //Statements
    | "Program"
    | "VariableDeclaration"
    | "FunctionDeclaration"
    | "ClassDeclaration"
    | "IfStatement"
    | "ForStatement"
    | "ForEachStatement"
    | "WhileStatement"
    | "ImportStatement"
    | "ExportDeclaration"
    | "ControlFlowStatement"
    | "ChooseStatement"
    | "NullStatement"

    // Expressions
    | "AssignmentExpression"
    | "CompoundAssignmentExpression"
    | "BinaryExpression"
    | "MembershipExpression"
    | "LogicalExpression"
    | "TernaryExpression"
    | "MemberExpression"
    | "CallExpression"
    | "ChooseExpression"

    // Literals
    | "Identifier"
    | "Property"
    | "NumericLiteral"
    | "StringLiteral"
    | "BooleanLiteral"
    | "ObjectLiteral"
    | "ListLiteral";

export interface Statement {
    kind: NodeType;
    line?: number;
    column?: number;
}

export interface Program extends Statement {
    kind: "Program";
    body: Statement[];
}

export interface VariableDeclaration extends Statement {
    kind: "VariableDeclaration";
    constant: boolean;
    assignee: Expression;
    value?: Expression;
    negative: boolean;
    reactive: boolean;
}

export interface FunctionDeclaration extends Statement {
    kind: "FunctionDeclaration";
    parameters: string[];
    name: string;
    expectedArgs: number;
    body: Statement[];
}

export interface ClassDeclaration extends Statement {
    kind: "ClassDeclaration";
    name: string;
    parameters: string[];
    blocks: Record<string,Statement[]>;
}

export interface IfStatement extends Statement {
    kind: "IfStatement";
    condition: Expression;
    then: Statement[];
    else?: Statement[];
}

export interface ForStatement extends Statement {
    kind: "ForStatement";
    assignment: AssignmentExpression | VariableDeclaration;
    declared: boolean;
    condition: Expression;
    increment: Expression;
    body: Statement[];
}

export interface ForEachStatement extends Statement {
    kind: "ForEachStatement";
    element: Identifier | VariableDeclaration;
    index?: Identifier | VariableDeclaration;
    list: Identifier | ListLiteral;
    body: Statement[];
}

export interface WhileStatement extends Statement {
    kind: "WhileStatement";
    condition: Expression;
    body: Statement[];
}

export interface ImportStatement extends Statement {
    kind: "ImportStatement";
    path: string;
}

export interface ExportDeclaration extends Statement {
    kind: "ExportDeclaration";
    declaration: Statement;
}

export interface ControlFlowStatement extends Expression {
    kind: "ControlFlowStatement";
    value: "break" | "continue" | "pass";
}

export interface ChooseCase {
    conditions: Expression[] | null; // null means default case
    body: Statement[] | Expression;
}

export interface ChooseStatement extends Statement {
    kind: "ChooseStatement";
    subject: Expression;
    cases: ChooseCase[];
    tempVariable?: Identifier; // Optional temporary variable for the subject
    chooseAll: boolean; // If true, all cases are evaluated
    defaultCase?: ChooseCase;
}

export interface NullStatement extends Expression {
    kind: "NullStatement";
}

export interface Expression extends Statement {}

export interface AssignmentExpression extends Expression {
    kind: "AssignmentExpression";
    assignee: Expression;
    value: Expression;
}

export interface CompoundAssignmentExpression extends Expression {
    kind: "CompoundAssignmentExpression";
    assignee: Expression;
    value: Expression;
    operator: string;
}

export interface BinaryExpression extends Expression {
    kind: "BinaryExpression";
    left: Expression;
    right: Expression;
    negative: boolean;
    operator: string;
}

export interface MembershipExpression extends Expression {
    kind: "MembershipExpression";
    left: Expression;
    right: Expression;
    not: boolean;
}

export interface LogicalExpression extends Expression {
    kind: "LogicalExpression";
    left: Expression;
    right: Expression;
    operator: string;
}

export interface TernaryExpression extends Expression {
    kind: "TernaryExpression";
    condition: Expression;
    left: Expression;
    right: Expression;
}

export interface MemberExpression extends Expression {
    kind: "MemberExpression";
    object: Expression;
    property: Expression;
    computed: boolean;
}

export interface CallExpression extends Expression {
    kind: "CallExpression";
    args: Expression[];
    caller: Expression;
}

export interface ChooseExpression extends Expression {
    kind: "ChooseExpression";
    subject: Expression;
    tempVariable?: Identifier; // Optional temporary variable for the subject
    cases: ChooseCase[];
    chooseAll: boolean; // If true, all cases are evaluated
    defaultCase?: ChooseCase;
}

export interface Identifier extends Expression {
    kind: "Identifier";
    symbol: string;
}

export interface Property extends Expression {
    kind: "Property";
    key: string;
    value?: Expression;
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

export interface ListLiteral extends Expression {
    kind: "ListLiteral";
    values: Expression[];
}
