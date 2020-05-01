import { Pattern, Identifier, RestElement, Node } from "estree";
import { Node as AcornNode } from "acorn";
import { x } from "code-red";

export default function traverse_destructure_pattern(
	node: Pattern,
	callback: (node: Identifier, parent: AcornNode, key: string | number, modifier: (node: Node) => Node) => void
) {
	function traverse(node: Pattern, parent, key, modifier: (node: Node) => Node) {
		switch (node.type) {
			case "Identifier":
				return callback(node, parent, key, modifier);
			case "ArrayPattern":
				for (let i = 0; i < node.elements.length; i++) {
					const element = node.elements[i];
					if (element.type === 'RestElement') {
						traverse(element, node.elements, i, node => x`${modifier(node)}.slice(${i})`);
					} else {
						traverse(element, node.elements, i, node => x`${modifier(node)}[${i}]`);
					}
				}
				break;
			case "ObjectPattern": {
					const used_properties = [];
					for (let i = 0; i < node.properties.length; i++) {
						const property = node.properties[i];
						if (property.type === "Property") {
							traverse(property.value, property, "value", node => x`${modifier(node)}.${property.key.name}`);
							used_properties.push(property.key.name);
						} else {
							traverse((property as any) as RestElement, node.properties, i, node => x`@object_without_properties(${modifier(node)}, [${used_properties}])`);
						}
					}
				}
				break;
			case "RestElement":
				return traverse(node.argument, node, 'argument', modifier);
			case "AssignmentPattern":
        return traverse(node.left, node, 'left', modifier);
		}
  }
  traverse(node, null, null, node => node);
}
