export class ToolTipElement extends HTMLElement {
	#internals = this.attachInternals();
	#anchorStyleSheet = new CSSStyleSheet();
	#interestTimeout;

	static #styles = new CSSStyleSheet();
	static {
		this.#styles.replaceSync(`
			:host(:state(open)) {
				position-anchor: --tool-tip-anchor;
			}
		`);
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = "<slot>";
		this.shadowRoot.adoptedStyleSheets = [
			this.constructor.#styles,
		];
		this.ownerDocument.adoptedStyleSheets.push(
			this.#anchorStyleSheet,
		);

		this.addEventListener("mouseenter", this);
		this.addEventListener("mouseleave", this);
	}

	get type() {
		return this.getAttribute("type") ?? "description";
	}

	set type(value) {
		this.setAttribute("type", value);
	}

	get htmlFor() {
		return this.getAttribute("for");
	}

	set htmlFor(value) {
		this.setAttribute("for", value);
	}

	static get observedAttributes() {
		return ["for", "type"];
	}
	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case "for": {
				const oldForElement = this.ownerDocument.getElementById(oldValue);
				const newForElement = this.ownerDocument.getElementById(newValue);

				if (this.type === "description") {
					oldForElement?.removeAttribute("aria-describedby");
					newForElement.ariaDescribedByElements = [this];
				} else if (this.type === "label") {
					oldForElement?.removeAttribute("aria-labelledby");
					newForElement.ariaLabelledByElements = [this];
				}

				this.#removeEventListeners(oldForElement);
				this.#addEventListeners(newForElement);

				break;
			}
			case "type": {
				const forElement = this.ownerDocument.getElementById(this.htmlFor);
				if (this.type === "description") {
					this.#internals.role = "tooltip"
					this.#internals.ariaHidden = false;
					forElement.removeAttribute("aria-labelledby");
					forElement.ariaDescribedByElements = [this];
				} else if (this.type === "label") {
					this.#internals.role = null;
					this.#internals.ariaHidden = true;
					forElement.removeAttribute("aria-describedby");
					forElement.ariaLabelledByElements = [this];
				}
				break;
			}
		}
	}

	connectedCallback() {
		this.popover = "hint";
		window.addEventListener("keydown", this);
	}

	disconnectedCallback() {
		window.removeEventListener("keydown", this);
	}

	#addEventListeners(element) {
		element.addEventListener("mouseenter", this);
		element.addEventListener("mouseleave", this);
		element.addEventListener("focus", this);
		element.addEventListener("blur", this);
	}

	#removeEventListeners(element) {
		element?.removeEventListener("mouseenter", this);
		element?.removeEventListener("mouseleave", this);
		element?.removeEventListener("focus", this);
		element?.removeEventListener("blur", this);
	}

	handleEvent(event) {
		switch (event.type) {
			case "mouseenter":
			case "focus":
				clearTimeout(this.#interestTimeout);

				if (this.#internals.states.has("open")) break;

				this.#interestTimeout = setTimeout(() => {
					this.#internals.states.add("open");
					this.#anchorStyleSheet.replaceSync(`
						#${this.htmlFor} {
							anchor-name: --tool-tip-anchor;
						}
					`);
					this.showPopover({ source: event.target });
				}, 500);
				break;
			case "mouseleave":
			case "blur":
				clearTimeout(this.#interestTimeout);
				this.#interestTimeout = setTimeout(() => {
					this.hidePopover();
					this.#internals.states.delete("open");
					this.#anchorStyleSheet.replaceSync("");
				}, 250);
				break;
			case "keydown":
				if (event.key === "Escape" && this.#internals.states.has("open")) {
					clearTimeout(this.#interestTimeout);
					this.hidePopover();
					this.#internals.states.delete("open");
					this.#anchorStyleSheet.replaceSync("");
				}
				break;
		}
	}
}

if (new URL(import.meta.url).searchParams.has("define"))
	customElements.define("tool-tip", ToolTipElement);
