import Renderer from '../Renderer';
import Block from '../Block';
import Wrapper from './shared/Wrapper';
import WithBlock from '../../nodes/WithBlock';
import FragmentWrapper from './Fragment';
import { Identifier, Node } from 'estree';
import create_debugging_comment from './shared/create_debugging_comment';
import { x, b } from 'code-red';

export default class WithBlockWrapper extends Wrapper {
	node: WithBlock;
	block: Block;
	fragment: FragmentWrapper;
	is_dynamic: boolean;

	var: Identifier = { type: 'Identifier', name: 'with_block' };

	block_value: Identifier;
	with_block: Identifier;
	get_context: Identifier;

	constructor(
		renderer: Renderer,
		block: Block,
		parent: Wrapper,
		node: WithBlock,
		strip_whitespace: boolean,
		next_sibling: Wrapper
	) {
		super(renderer, block, parent, node);
		this.cannot_use_innerhtml();
		this.not_static_content();

		block.add_dependencies(node.expression.dependencies);

		node.contexts.forEach(({node}) => {
			block.renderer.add_to_context(node.name, true);
		});

		this.block = block.child({
			comment: create_debugging_comment(node, this.renderer.component),
			name: renderer.component.get_unique_name(`create_with_block`),
			type: 'with',
			bindings: new Map(block.bindings)
		});

		this.block_value = renderer.component.get_unique_name(`${this.var.name}_value`);
		this.with_block = block.get_unique_name(this.var.name);
		this.get_context = renderer.component.get_unique_name(`get_${this.var.name}_context`);
		renderer.add_to_context(this.block_value.name, true);

		const store =
			node.expression.node.type === 'Identifier' &&
			node.expression.node.name[0] === '$'
				? node.expression.node.name.slice(1)
				: null;

		node.contexts.forEach(({node, modifier}) => {
			this.block.bindings.set(node.name, {
				object: this.block_value,
				modifier,
				snippet: modifier(this.block_value),
				store
			});
		});

		renderer.blocks.push(this.block);

		this.fragment = new FragmentWrapper(
			renderer,
			this.block,
			node.children,
			this,
			strip_whitespace,
			next_sibling
		);

		this.is_dynamic = this.block.dependencies.size > 0;
		if (this.is_dynamic) {
			block.add_dependencies(this.block.dependencies);
		}
		this.block.has_update_method = this.is_dynamic;
	}

	render(
		block: Block,
		parent_node: Identifier,
		parent_nodes: Identifier
	) {
		const initial_anchor_node: Identifier = { type: 'Identifier', name: parent_node ? 'null' : 'anchor' };
		const initial_mount_node: Identifier = parent_node || { type: 'Identifier', name: '#target' };
		const update_anchor_node: Identifier = this.get_or_create_anchor(block, parent_node, parent_nodes);
		const update_mount_node: Identifier = this.get_update_mount_node(update_anchor_node);

		const snippet = this.node.expression.manipulate(block);
		const value_index = block.renderer.context_lookup.get(this.block_value.name).index;

		const dependencies = this.node.expression.dynamic_dependencies();

		if (this.node.context_node.type === 'Identifier') {
			(this.node.context_node as Node) = x`#child_ctx[${block.renderer.context_lookup.get(this.node.context_node.name).index}]`;
		} else {
			this.node.contexts.forEach(({ node, parent, key }) => {
				parent[key] = x`#child_ctx[${block.renderer.context_lookup.get(node.name).index}]`;
			});
		}

		this.renderer.blocks.push(b`
			function ${this.get_context}(#ctx, #i) {
				const #child_ctx = #ctx.slice();
				#child_ctx[#i] = (${this.node.context_node} = ${snippet});
				return #child_ctx;
			}
		`);

		block.chunks.init.push(b`
			let ${this.with_block} = ${this.block.name}(${this.get_context}(#ctx, ${value_index}));
		`);

		block.chunks.create.push(b`
			${this.with_block}.c();
		`);

		if (parent_nodes && this.renderer.options.hydratable) {
			block.chunks.claim.push(b`
				${this.with_block}.l(${parent_nodes});
			`);
		}

		block.chunks.mount.push(b`
			${this.with_block}.m(${initial_mount_node}, ${initial_anchor_node});
		`);

		if (dependencies.length > 0) {
			const body = this.block.has_update_method
				? b`
					if (${this.with_block}) {
						${this.with_block}.p(child_ctx, #dirty);
					} else {
						${this.with_block} = ${this.block.name}(child_ctx);
						${this.with_block}.c();
						${this.with_block}.m(${update_mount_node}, ${update_anchor_node});
					}
				`
				: b`
					if (${this.with_block}) {
						${this.with_block} = ${this.block.name}(child_ctx);
						${this.with_block}.c();
						${this.with_block}.m(${update_mount_node}, ${update_anchor_node});
					}
				`;

			block.chunks.update.push(b`
				if (${block.renderer.dirty(dependencies)}) {
					const child_ctx = ${this.get_context}(#ctx, ${value_index});

					${body}
				}
				`);
		}

		block.chunks.destroy.push(b`${this.with_block}.d(detaching)`);

		this.fragment.render(this.block, null, x`#nodes` as Identifier);
	}
}
