import { Column, SelectedColumn, SQLElement, SQLVariable, SQLCall } from './core.js';

declare module './core.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SQLElement {
    toRawString(): string;
    toColumn(): Column;
    toSelectedColumn(): SelectedColumn;
    toInput(): SQLVariable;
    toCall(): SQLCall;
  }
}

SQLElement.prototype.toRawString = function (): string {
  return this.value as string;
};

SQLElement.prototype.toColumn = function (): Column {
  return this.value as Column;
};

SQLElement.prototype.toSelectedColumn = function (): SelectedColumn {
  return this.value as SelectedColumn;
};

SQLElement.prototype.toInput = function (): SQLVariable {
  return this.value as SQLVariable;
};

SQLElement.prototype.toCall = function (): SQLCall {
  return this.value as SQLCall;
};
