import { SQLElement, SQLVariable } from './sql';
import { Column } from './core';
import { RawColumn } from '../actions/rawColumn';
import { SQLCall } from './sqlCall';

declare module './sql' {
  interface SQLElement {
    toRawString(): string;
    toColumn(): Column;
    toRawColumn(): RawColumn;
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

SQLElement.prototype.toRawColumn = function (): RawColumn {
  return this.value as RawColumn;
};

SQLElement.prototype.toInput = function (): SQLVariable {
  return this.value as SQLVariable;
};

SQLElement.prototype.toCall = function (): SQLCall {
  return this.value as SQLCall;
};
