import IBindingMap = require('./IBindingMap');
import IBindingEventMap = require('./IBindingEventMap');

interface IBinding {
  id: string;
  className?: IBindingMap;
  css?: IBindingMap;
  text?: string;
  html?: string;
  element?: HTMLElement; // lazily set
  attr?: IBindingMap;
  childId?: string //what is this used for?
  events?: IBindingEventMap;
};

export = IBinding;