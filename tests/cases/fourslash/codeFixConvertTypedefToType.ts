/// <reference path='fourslash.ts' />

/////**
//// * @typedef {Object} Foo
//// * @property {Number} bar
//// */

verify.codeFix({
  description: ts.Diagnostics.Convert_typedef_to_type.message,
  errorCode: ts.Diagnostics.Convert_typedef_to_type.code,
  newFileContent: `type Foo = {
  bar: number
};`,
});
