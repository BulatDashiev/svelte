import {
	SvelteComponent,
	attr,
	detach,
	element,
	init,
	insert,
	listen,
	noop,
	run_all,
	safe_not_equal,
	space
} from "svelte/internal";

function create_fragment(ctx) {
	let input0;
	let t;
	let input1;
	let dispose;

	return {
		c() {
			input0 = element("input");
			t = space();
			input1 = element("input");
			attr(input0, "type", "file");
			attr(input1, "type", "file");

			dispose = [
				listen(input0, "change", ctx.input0_change_handler),
				listen(input1, "change", ctx.input1_change_handler)
			];
		},
		m(target, anchor) {
			insert(target, input0, anchor);
			insert(target, t, anchor);
			insert(target, input1, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(input0);
			if (detaching) detach(t);
			if (detaching) detach(input1);
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { files } = $$props;

	function input0_change_handler() {
		files = this.files;
		$$invalidate("files", files);
	}

	function input1_change_handler() {
		files = this.files;
		$$invalidate("files", files);
	}

	$$self.$set = $$props => {
		if ("files" in $$props) $$invalidate("files", files = $$props.files);
	};

	return {
		files,
		input0_change_handler,
		input1_change_handler
	};
}

class Component extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { files: 0 });
	}
}

export default Component;