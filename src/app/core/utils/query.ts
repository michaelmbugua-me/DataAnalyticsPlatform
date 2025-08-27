// Minimal, safe query evaluator supporting expressions like:
//   country == 'US' and events_count > 100 or platform == 'ios'
// - Supported ops: ==, !=, >, >=, <, <=
// - Logical: and, or (left-to-right, same precedence, no parentheses)
// - String literals must be single-quoted, numbers are parsed as floats

export type Primitive = string | number | boolean | null | undefined;

export function evaluateQuery(record: Record<string, any>, query: string): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;

  // Parse simple sequence: cond ((and|or) cond)*
  let idx = 0;
  const readCondition = (): boolean => {
    const field = tokens[idx++];
    const op = tokens[idx++];
    const valueTok = tokens[idx++];
    if (!field || !op || valueTok == null) return false;

    const left = getValue(record, field);
    const right = parseValue(valueTok);
    return compare(left, op, right);
  };

  let result = readCondition();
  while (idx < tokens.length) {
    const logical = tokens[idx++]?.toLowerCase();
    const next = readCondition();
    if (logical === 'and') result = result && next;
    else if (logical === 'or') result = result || next;
    else return false; // invalid token
  }
  return !!result;
}

function getValue(rec: Record<string, any>, path: string): Primitive {
  // support simple dot paths a.b.c
  const parts = path.split('.');
  let cur: any = rec;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur as Primitive;
}

function compare(a: Primitive, op: string, b: Primitive): boolean {
  switch (op) {
    case '==': return looselyEqual(a, b);
    case '!=': return !looselyEqual(a, b);
    case '>': return num(a) > num(b);
    case '>=': return num(a) >= num(b);
    case '<': return num(a) < num(b);
    case '<=': return num(a) <= num(b);
    default: return false;
  }
}

function looselyEqual(a: Primitive, b: Primitive): boolean {
  // Compare numbers if both parse as numbers, else as strings
  const na = toMaybeNumber(a);
  const nb = toMaybeNumber(b);
  if (na != null && nb != null) return na === nb;
  return String(a) === String(b);
}

function num(v: Primitive): number {
  const n = toMaybeNumber(v);
  return n != null ? n : NaN;
}

function toMaybeNumber(v: Primitive): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(+v)) return +v;
  return null;
}

function tokenize(q: string): string[] {
  const tokens: string[] = [];
  const re = /\s*(>=|<=|==|!=|>|<|and|or|[A-Za-z_][A-Za-z0-9_\.]*|'[^']*'|\d+(?:\.\d+)?)/y;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(q)) !== null) {
    const tok = m[1];
    tokens.push(tok);
    idx = re.lastIndex;
  }
  // if we didn't consume full string and non-space remains, it's invalid; return empty
  if (idx < q.length && q.slice(idx).trim() !== '') return [];
  return tokens;
}

function parseValue(tok: string): Primitive {
  if (tok.startsWith("'")) {
    return tok.slice(1, -1);
  }
  if (!isNaN(+tok)) return +tok;
  // bareword value fallback to string
  return tok;
}
