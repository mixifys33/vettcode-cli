/**
 * AST Parser
 * Extracts structural metadata WITHOUT code content
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ParsedFile, FunctionInfo, EntryPoint, ExternalCall } from './types';

export async function parseFile(filePath: string, projectRoot: string): Promise<ParsedFile> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(projectRoot, filePath);
  const extension = path.extname(filePath);

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const imports: string[] = [];
  const exports: string[] = [];
  const functions: FunctionInfo[] = [];
  const calls: string[] = [];
  const entryPoints: EntryPoint[] = [];
  const externalCalls: ExternalCall[] = [];

  function visit(node: ts.Node) {
    // Extract imports
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        imports.push(moduleSpecifier.text);
      }
    }

    // Extract exports
    if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
      exports.push('export');
    }

    // Extract function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.push({
        name: node.name.text,
        file: relativePath,
        type: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ? 'async' : 'function',
        exported: node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false,
      });
    }

    // Extract arrow functions assigned to variables
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (decl.name && ts.isIdentifier(decl.name) && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            functions.push({
              name: decl.name.text,
              file: relativePath,
              type: 'arrow',
              exported: node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false,
            });
          }
        }
      });
    }

    // Extract method declarations
    if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      functions.push({
        name: node.name.text,
        file: relativePath,
        type: 'method',
        exported: false,
      });
    }

    // Extract function calls
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression)) {
        calls.push(expression.text);
        
        // Detect external calls
        detectExternalCall(expression.text, relativePath, externalCalls);
      } else if (ts.isPropertyAccessExpression(expression)) {
        const callName = expression.name.text;
        calls.push(callName);
        
        // Detect HTTP calls
        if (expression.expression && ts.isIdentifier(expression.expression)) {
          const object = expression.expression.text;
          if (object === 'fetch' || object === 'axios' || object === 'http' || object === 'https') {
            externalCalls.push({
              type: 'http',
              file: relativePath,
              function: callName,
            });
          }
        }
        
        // Detect entry points (Express routes)
        if (['get', 'post', 'put', 'delete', 'patch'].includes(callName)) {
          if (expression.expression && ts.isIdentifier(expression.expression)) {
            const object = expression.expression.text;
            if (object === 'app' || object === 'router') {
              entryPoints.push({
                type: 'route',
                file: relativePath,
                name: callName,
                method: callName.toUpperCase(),
              });
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    path: filePath,
    relativePath,
    extension,
    imports,
    exports,
    functions,
    calls,
    entryPoints,
    externalCalls,
  };
}

function detectExternalCall(funcName: string, file: string, externalCalls: ExternalCall[]) {
  const dbPatterns = ['query', 'execute', 'find', 'findOne', 'save', 'update', 'delete', 'insert'];
  const fsPatterns = ['readFile', 'writeFile', 'mkdir', 'unlink', 'stat'];
  const processPatterns = ['exec', 'spawn', 'fork'];

  if (dbPatterns.some(p => funcName.toLowerCase().includes(p))) {
    externalCalls.push({ type: 'database', file, function: funcName });
  } else if (fsPatterns.some(p => funcName.includes(p))) {
    externalCalls.push({ type: 'filesystem', file, function: funcName });
  } else if (processPatterns.some(p => funcName.includes(p))) {
    externalCalls.push({ type: 'process', file, function: funcName });
  }
}

export async function parseFiles(files: string[], projectRoot: string): Promise<ParsedFile[]> {
  const results: ParsedFile[] = [];
  
  for (const file of files) {
    try {
      const parsed = await parseFile(file, projectRoot);
      results.push(parsed);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  }
  
  return results;
}
