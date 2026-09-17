import type { ValidationIssue, ValidationSummary } from "../types";

function issueKey(issue: ValidationIssue): string {
  return issue.id || `${issue.level}:${issue.message}`;
}

export function mergeValidationIssues(
  primary: ValidationIssue[] | undefined,
  secondary: ValidationIssue[],
): ValidationIssue[] {
  const map = new Map<string, ValidationIssue>();
  for (const issue of primary ?? []) {
    map.set(issueKey(issue), issue);
  }
  for (const issue of secondary) {
    map.set(issueKey(issue), issue);
  }
  return [...map.values()];
}

export function mergeValidationSummary(a: ValidationSummary | undefined, b: ValidationSummary): ValidationSummary {
  if (!a) {
    return b;
  }
  return {
    errorCount: Math.max(a.errorCount, b.errorCount),
    warnCount: Math.max(a.warnCount, b.warnCount),
    externalCount: Math.max(a.externalCount, b.externalCount),
    ok: a.ok && b.ok,
  };
}
