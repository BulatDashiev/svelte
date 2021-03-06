import {
	SvelteComponent,
	create_component,
	destroy_component,
	detach,
	element,
	init,
	insert,
	listen,
	mount_component,
	safe_not_equal,
	set_input_value,
	space,
	transition_in,
	transition_out
} from "svelte/internal";

import Foo from "./Foo.svelte";
import Bar from "./Bar.svelte";

function create_fragment(ctx) {
	let t0;
	let t1;
	let input;
	let current;
	let dispose;
	const foo = new Foo({ props: { x: y } });
	const bar = new Bar({ props: { x: ctx.z } });

	return {
		c() {
			create_component(foo.$$.fragment);
			t0 = space();
			create_component(bar.$$.fragment);
			t1 = space();
			input = element("input");
			dispose = listen(input, "input", ctx.input_input_handler);
		},
		m(target, anchor) {
			mount_component(foo, target, anchor);
			insert(target, t0, anchor);
			mount_component(bar, target, anchor);
			insert(target, t1, anchor);
			insert(target, input, anchor);
			set_input_value(input, ctx.z);
			current = true;
		},
		p(changed, ctx) {
			const bar_changes = {};
			if (changed.z) bar_changes.x = ctx.z;
			bar.$set(bar_changes);

			if (changed.z && input.value !== ctx.z) {
				set_input_value(input, ctx.z);
			}
		},
		i(local) {
			if (current) return;
			transition_in(foo.$$.fragment, local);
			transition_in(bar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(foo.$$.fragment, local);
			transition_out(bar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(foo, detaching);
			if (detaching) detach(t0);
			destroy_component(bar, detaching);
			if (detaching) detach(t1);
			if (detaching) detach(input);
			dispose();
		}
	};
}

let y = 1;

function instance($$self, $$props, $$invalidate) {
	let z = 2;

	function input_input_handler() {
		z = this.value;
		$$invalidate("z", z);
	}

	return { z, input_input_handler };
}

class Component extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

export default Component;