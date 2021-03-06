modV.prototype.LFOController = class {
	constructor(Control, Module, LFOSettings) {

		this.LFO = new LFO(LFOSettings);
		this.Control = Control;
		this.Module = Module;
		this.id = Module.info.safeName + '-LFO-' + Control.variable;

	}

	update() {
		let LFOValue = this.LFO.value();
		modV.isControl(this.Control, {
			range: () => {
				let min = this.Control.min;
				let max = this.Control.max;

				let value = Math.map(LFOValue, -1, 1, min, max);
				this.Control.writeValue(value);
			},

			select: () => {

			},

			checkbox: () => {

			}
		});
	}
};