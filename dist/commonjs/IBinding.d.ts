import IBindingMap = require('./IBindingMap');
import IBindingEventMap = require('./IBindingEventMap');
interface IBinding {
    id: string;
    className?: IBindingMap;
    css?: IBindingMap;
    text?: string;
    html?: string;
    element?: HTMLElement;
    attr?: IBindingMap;
    childId?: string;
    events?: IBindingEventMap;
}
export = IBinding;
