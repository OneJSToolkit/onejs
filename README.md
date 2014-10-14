
# The OneJS Toolkit helps you build reuseable web views.

Visit the [wiki documentation](https://github.com/OneJSToolkit/onejs/wiki) to get started working with OneJS!

**Don't think of it as "yet another JavaScript framework."** It's a small set of classes/interfaces that provide a common foundation for producing reusable control libraries that can be bundled and distributed, while minimizing impact on file size.

**You only load what you need.** Everything is modular and is required using RequireJS. If you only need the View class, you only bundle that with your code. If you use repeat blocks, you include the Repeater class. If you use Selection, you include that. Grow your core only as big as you need it to be. A barebones reusable web view, merged with the common core only adds 5k to the package. No more demanding yet another framework on their site.

**Start with html and css, make it reusable.** Creating a JavaScript view class is a matter of adding a js-type attribute on your root element and piping it through a template compiler.

**Simple to understand.** HTML templates compile to easily consumable JavaScript classes, so that they can be reused over and over.

# The OneJS Toolkit consists of:

* A core set of TypeScript classes, available from the github repo OneJS. You include only what you need and merge into a small redistributable, or build a site and merge a collection of controls plus classes together.
* A template compiler that can validate your html and binding correctness, and output a JavaScript or TypeScript class which can be instantiated and rendered. Available as a gulp plugin.
* A css to js converter that converts css into a JavaScript module which can be bundled, loaded on demand, and remapped for localization purposes.

## How it works

You spin up a new auto generated project. This is as easy as typing "yo onejs".

You write View templates. The templates are HTML and have bindings similar to what you might expect in many templating frameworks. For example, here's a toggle button view which binds an "isToggled" state to light up a css class:

```html
<button class="ToggleButton"
    js-type="ToggleButton"
    js-bind="value:value, className.isToggled:isToggled"
    js-event="click:$toggle('isToggled')" >
</button>
```

Behind the scenes, the template compiler can compile this down into an AMD-ready typescript class that we can render programatically:

```typescript
import View = require('../onejs/View');
import DomUtils = require('../onejs/DomUtils');

class ToggleButton extends View {
    viewName = 'ToggleButton';

    onRender(): HTMLElement {
        var _this = this;
        var bindings = _this._bindings;

        return (_this.element = DomUtils.ce("button", ["class","ToggleButton"], [], bindings[0]));
    }

    // ... plus annotations on the bindings.
}

export = ToggleButton;
```

You can make other views that include the toggle button:

```typescript
<div js-type="RootApp">
    <toggle-button js-init="value: 'click me', isToggled: true"></toggle-button>
</div>
```

...and all imports, rendered nesting, observing, and data management will be generated for you. 

