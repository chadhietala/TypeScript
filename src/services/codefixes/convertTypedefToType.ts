namespace ts.codefix {
    const fixId = "convertTypedefToType";
    registerCodeFix({
        fixIds: [fixId],
        errorCodes: [Diagnostics.Convert_typedef_to_type.code],
        getCodeActions(context) {
            debugger;
            const checker = context.program.getTypeChecker();
            const info = getInfo(
                context.sourceFile,
                context.span.start,
                checker
            );
            const changes = textChanges.ChangeTracker.with(context, (t) => {
                const node = getTokenAtPosition(
                    context.sourceFile,
                    context.span.start
                );

                if (containsTypeDefTag(node)) {
                    fixSingleTypeDef(t, node, context, info?.typeNode);
                }
            });

            if (changes.length > 0) {
                return [
                    createCodeFixAction(
                        fixId,
                        changes,
                        Diagnostics.Convert_typedef_to_type,
                        fixId,
                        Diagnostics.Convert_all_typedefs_to_types
                    ),
                ];
            }
        },
        getAllCodeActions() {
            debugger;
            return { changes: [] };
        },
    });

    function fixSingleTypeDef(
        changes: textChanges.ChangeTracker,
        typeDefNode: JSDocTypedefTag | undefined,
        context: CodeFixContextBase,
        typeNode?: TypeNode
    ) {
        if (!typeDefNode?.name || !typeDefNode?.fullName || !typeNode) {
            return undefined;
        }

        const comment = typeDefNode.parent;

        changes.replaceNode(
            context.sourceFile,
            comment,
            factory.createTypeAliasDeclaration(
                [],
                typeDefNode.fullName.getFullText(),
                getTypeParameters(typeDefNode),
                typeNode
            )
            // factory.createTypeParameterDeclaration()
        );
    }

    function getInfo(
        sourceFile: SourceFile,
        pos: number,
        checker: TypeChecker
    ): { readonly typeNode: TypeNode; readonly type: Type } | undefined {
        const decl = findAncestor(
            getTokenAtPosition(sourceFile, pos),
            isTypeContainer
        );
        const typeNode = decl && decl.type;
        return (
            typeNode && {
                typeNode,
                type: checker.getTypeFromTypeNode(typeNode),
            }
        );
    }

    type TypeContainer =
        | AsExpression
        | CallSignatureDeclaration
        | ConstructSignatureDeclaration
        | FunctionDeclaration
        | GetAccessorDeclaration
        | IndexSignatureDeclaration
        | MappedTypeNode
        | MethodDeclaration
        | MethodSignature
        | ParameterDeclaration
        | PropertyDeclaration
        | PropertySignature
        | SetAccessorDeclaration
        | TypeAliasDeclaration
        | TypeAssertion
        | VariableDeclaration;
    function isTypeContainer(node: Node): node is TypeContainer {
        // NOTE: Some locations are not handled yet:
        // MappedTypeNode.typeParameters and SignatureDeclaration.typeParameters, as well as CallExpression.typeArguments
        switch (node.kind) {
            case SyntaxKind.AsExpression:
            case SyntaxKind.CallSignature:
            case SyntaxKind.ConstructSignature:
            case SyntaxKind.FunctionDeclaration:
            case SyntaxKind.GetAccessor:
            case SyntaxKind.IndexSignature:
            case SyntaxKind.MappedType:
            case SyntaxKind.MethodDeclaration:
            case SyntaxKind.MethodSignature:
            case SyntaxKind.Parameter:
            case SyntaxKind.PropertyDeclaration:
            case SyntaxKind.PropertySignature:
            case SyntaxKind.SetAccessor:
            case SyntaxKind.TypeAliasDeclaration:
            case SyntaxKind.TypeAssertionExpression:
            case SyntaxKind.VariableDeclaration:
                return true;
            default:
                return false;
        }
    }

    function getTypeParameters(node: JSDocTypedefTag) {
        if (node.typeExpression && isJSDocTypeLiteral(node.typeExpression)) {
            node.typeExpression.jsDocPropertyTags?.map((tag) => {
                return factory.createTypeParameterDeclaration(
                    [],
                    tag.name.getFullText()
                );
            });
        }

        return [];
    }

    export function _containsJSDocTypedef(node: Node): node is HasJSDoc {
        if (hasJSDocNodes(node)) {
            const jsDocNodes = node.jsDoc || [];
            return jsDocNodes.some((node) => {
                const tags = node.tags || [];
                return tags.some((tag) => isJSDocTypedefTag(tag));
            });
        }
        return false;
    }

    export function getJSDocTypedefNode(node: HasJSDoc): JSDocTypedefTag {
        const jsDocNodes = node.jsDoc || [];

        return flatMap(jsDocNodes, (node) => {
            const tags = node.tags || [];
            return tags.filter((tag) => isJSDocTypedefTag(tag));
        })[0] as unknown as JSDocTypedefTag;
    }

    export function containsTypeDefTag(node: Node): node is JSDocTypedefTag {
        return isInJSDoc(node) && isJSDocTypedefTag(node);
    }
}
