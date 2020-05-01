import AbstractBlock from './shared/AbstractBlock';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { INode } from './interfaces';
import map_children from './shared/map_children';
import { Pattern, Identifier, Node } from 'estree';
import { Node as AcornNode } from 'acorn';
import Expression from './shared/Expression';
import traverse_destructure_pattern from '../utils/traverse_destructure_pattern';

export default class WithBlock extends AbstractBlock {
	type: 'WithBlock';
	expression: Expression;
	scope: TemplateScope;
	context_node: Pattern;
	contexts: {
		node: Identifier,
		parent: AcornNode,
		key: string | number,
		modifier: (node: Node) => Node
	}[];

	constructor(component: Component, parent: INode, scope: TemplateScope, info: any) {
		super(component, parent, scope, info);

		this.expression = new Expression(component, this, scope, info.expression);
		this.context_node = info.value;
		this.scope = scope.child();

		this.contexts = [];
		traverse_destructure_pattern(info.value, (node, parent, key, modifier) => {
			this.contexts.push({ node, parent, key, modifier });
			this.scope.add(node.name, this.expression.dependencies, this);
		});

		this.children = map_children(component, parent, this.scope, info.children);

		this.warn_if_empty_block();
	}
}
